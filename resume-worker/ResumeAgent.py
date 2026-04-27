"""
ResumeUpdateAgent - A 2-node LangGraph agent for updating portfolio database from resume text.

Uses Google Gemini API for LLM calls with proper tool support.
Follows SOLID principles with dependency injection and design patterns.

Nodes:
1. REASONER - Analyzes resume text and existing DB records to plan SQL updates
2. SQL_EXECUTOR - LLM-powered node with tools to execute and verify SQL queries

Architecture:
- Repository Pattern for database access
- Factory Pattern for LLM provider creation
- Strategy Pattern for node behaviors
- Observer Pattern for state monitoring
"""

import os
import json
import typing
import re
from typing import List, Optional, Any, Protocol, Annotated
from datetime import date
from dataclasses import dataclass

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END, add_messages
from langgraph.prebuilt import ToolNode


# Load environment variables
load_dotenv()

# Default settings
DEFAULT_MODEL = "gemini-3.1-flash-lite-preview"

# Verbose mode
VERBOSE = True


# ============================================================================
# PROTOCOLS (Dependency Inversion Principle)
# ============================================================================

class ILLMProvider(Protocol):
    """Interface for LLM providers."""
    def invoke(self, messages: List[BaseMessage]) -> AIMessage: ...
    def bind_tools(self, tools: List) -> "ILLMProvider": ...


class IDatabaseRepository(Protocol):
    """Interface for database operations."""
    def fetch_profile(self) -> Optional[dict]: ...
    def fetch_experiences(self) -> List[dict]: ...
    def fetch_projects(self) -> List[dict]: ...
    def fetch_all(self) -> dict: ...
    def execute_query(self, query: str) -> str: ...


class IStateObserver(Protocol):
    """Interface for state observation."""
    def on_state_change(self, state: "ResumeUpdateState", node_name: str) -> None: ...


# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class AgentConfig:
    """Configuration for ResumeUpdateAgent."""
    model_name: str = "gemini-3.1-flash-lite-preview"
    google_api_key: Optional[str] = None
    database_url: Optional[str] = None
    temperature: float = 0
    max_retries: int = 3
    verbose: bool = True
    
    @classmethod
    def from_env(cls) -> "AgentConfig":
        """Load configuration from environment variables."""
        return cls(
            model_name=os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview"),
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            database_url=os.getenv("DATABASE_URL"),
        )


def log(message: str, level: str = "INFO"):
    """Print a log message with formatting."""
    if VERBOSE or level in ["ERROR", "WARN"]:
        icons = {
            "INFO": "ℹ️",
            "DEBUG": "🔍",
            "WARN": "⚠️",
            "ERROR": "❌",
            "SUCCESS": "✅",
            "SQL": "💾",
            "LLM": "🤖",
            "TOOL": "🔧",
            "GRAPH": "📊"
        }
        icon = icons.get(level, "•")
        print(f"{icon} [{level}] {message}")


def extract_json_from_text(text) -> dict:
    """Extract JSON from LLM response text or content list."""
    log("Parsing JSON...", "DEBUG")
    
    # Handle Gemini's list response format
    if isinstance(text, list):
        # Extract text from list of content parts
        text_parts = []
        for part in text:
            if isinstance(part, dict) and 'text' in part:
                text_parts.append(part['text'])
            elif isinstance(part, str):
                text_parts.append(part)
        text = '\n'.join(text_parts)
    
    # Ensure text is a string
    if not isinstance(text, str):
        text = str(text)
    
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try extracting from code blocks
    patterns = [
        r'```json\s*([\s\S]*?)\s*```',
        r'```\s*([\s\S]*?)\s*```',
        r'\{[\s\S]*\}',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            try:
                clean = match.strip()
                if not clean.startswith('{'):
                    start = clean.find('{')
                    end = clean.rfind('}')
                    if start != -1 and end != -1:
                        clean = clean[start:end+1]
                return json.loads(clean)
            except json.JSONDecodeError:
                continue
    
    # Try fixing common issues
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        try:
            fixed = text[start:end+1]
            fixed = re.sub(r',\s*}', '}', fixed)
            fixed = re.sub(r',\s*]', ']', fixed)
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass
    
    raise ValueError("Could not extract JSON")


# ============================================================================
# FACTORY PATTERN (Open/Closed Principle)
# ============================================================================

class GeminiProvider:
    """Concrete implementation of LLM provider using Google Gemini (OCP)."""
    
    def __init__(self, config: AgentConfig):
        self._config = config
        self._llm = ChatGoogleGenerativeAI(
            model=config.model_name,
            temperature=config.temperature,
            google_api_key=config.google_api_key
        )
        self._bound_llm = None
    
    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        """Invoke the LLM with messages."""
        llm = self._bound_llm if self._bound_llm else self._llm
        return llm.invoke(messages)
    
    def bind_tools(self, tools: List) -> "GeminiProvider":
        """Create a new provider with tools bound."""
        bound = GeminiProvider.__new__(GeminiProvider)
        bound._config = self._config
        bound._llm = self._llm
        bound._bound_llm = self._llm.bind_tools(tools)
        return bound


class LLMProviderFactory:
    """Factory for creating LLM providers (Factory Pattern)."""
    
    @staticmethod
    def create_provider(config: AgentConfig) -> ILLMProvider:
        """Create an LLM provider based on configuration."""
        # In future, can add: if config.provider_type == "openai": return OpenAIProvider(config)
        return GeminiProvider(config)


# ============================================================================
# OBSERVER PATTERN (Single Responsibility Principle)
# ============================================================================

class ConsoleStateObserver:
    """Observer that logs state changes to console (Observer Pattern, SRP)."""
    
    def on_state_change(self, state: "ResumeUpdateState", node_name: str) -> None:
        """Display complete agent state after node execution."""
        print(f"\n{'='*70}")
        print(f"📸 STATE SNAPSHOT: {node_name}")
        print(f"{'='*70}")
        
        # Input data
        print(f"\n📥 INPUT:")
        print(f"   Resume Text: {len(state.get('resume_text', ''))} chars")
        
        # Database state
        if state.get('current_db_data'):
            data = state['current_db_data']
            print(f"\n💾 DATABASE:")
            profile = data.get('profile', {})
            print(f"   Profile: {profile.get('name', 'N/A')} - {profile.get('title', 'N/A')}")
            print(f"   Experiences: {len(data.get('experience', []))} records")
            for exp in data.get('experience', [])[:3]:
                print(f"      • {exp.get('role')} at {exp.get('company')}")
            print(f"   Projects: {len(data.get('projects', []))} records")
            for proj in data.get('projects', [])[:3]:
                print(f"      • {proj.get('title')}")
        
        # Comparison results
        if state.get('reasoning_output'):
            print(f"\n🔍 COMPARISON: {state['reasoning_output']}")
        
        # SQL queries
        sql_queries = state.get('sql_queries', [])
        if sql_queries:
            print(f"\n📝 SQL QUERIES: {len(sql_queries)} generated")
            for i, query in enumerate(sql_queries[:3], 1):
                print(f"   {i}. {query[:75]}...")
            if len(sql_queries) > 3:
                print(f"   ... and {len(sql_queries) - 3} more")
        
        # Execution progress
        queries_executed = state.get('queries_executed', 0)
        if queries_executed > 0:
            print(f"\n✅ EXECUTION PROGRESS:")
            print(f"   Queries Executed: {queries_executed}/{len(sql_queries)}")
        
        # Messages
        messages = state.get('messages', [])
        if messages:
            print(f"\n💬 MESSAGE HISTORY: {len(messages)} messages")
            last_msg = messages[-1]
            msg_type = type(last_msg).__name__
            print(f"   Last Message: {msg_type}")
            if hasattr(last_msg, 'tool_calls') and last_msg.tool_calls:
                print(f"   Tool Calls: {len(last_msg.tool_calls)}")
                for tc in last_msg.tool_calls[:2]:
                    print(f"      • {tc['name']}")
        
        # Status
        print(f"\n🎯 STATUS:")
        print(f"   Complete: {state.get('is_complete', False)}")
        print(f"   Errors: {state.get('error_count', 0)}")
        
        if state.get('final_summary'):
            print(f"   Summary: {state['final_summary']}")
        
        print(f"\n{'='*70}\n")


# ============================================================================
# REPOSITORY PATTERN (Single Responsibility Principle)
# ============================================================================

class PortfolioDatabaseRepository:
    """Repository for portfolio database operations (SRP)."""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
    
    def _get_connection(self):
        """Get database connection."""
        return psycopg2.connect(self.database_url)
    
    def fetch_profile(self) -> Optional[dict]:
        """Fetch profile data."""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM profile LIMIT 1")
                result = cur.fetchone()
                return dict(result) if result else None
    
    def fetch_experiences(self) -> List[dict]:
        """Fetch experience records."""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM experience ORDER BY start_date DESC")
                return [dict(row) for row in cur.fetchall()]
    
    def fetch_projects(self) -> List[dict]:
        """Fetch project records."""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM projects ORDER BY display_order ASC")
                return [dict(row) for row in cur.fetchall()]
    
    def fetch_all(self) -> dict:
        """Fetch all portfolio data."""
        return {
            "profile": self.fetch_profile(),
            "experience": self.fetch_experiences(),
            "projects": self.fetch_projects()
        }
    
    def execute_query(self, query: str) -> str:
        """Execute a SQL query and return result message."""
        with self._get_connection() as conn:
            try:
                with conn.cursor() as cur:
                    cur.execute(query)
                    conn.commit()
                    
                    if query.strip().upper().startswith("SELECT"):
                        rows = cur.fetchall()
                        return f"SUCCESS: {len(rows)} rows"
                    else:
                        return f"SUCCESS: {cur.rowcount} rows affected"
            except Exception as e:
                conn.rollback()
                return f"ERROR: {str(e)}"


def create_database_tools(repository: IDatabaseRepository):
    """Factory function to create tools with injected repository (DIP)."""
    
    @tool
    def execute_sql(query: str) -> str:
        """Execute a SQL query on the database."""
        log(f"TOOL execute_sql: {query[:120]}...", "TOOL")
        result = repository.execute_query(query)
        log(result, "SUCCESS" if "SUCCESS" in result else "ERROR")
        return result
    
    @tool
    def fetch_current_state(table: str) -> str:
        """Fetch current data from a table."""
        log(f"TOOL fetch_current_state({table})", "TOOL")
        
        if table not in ['profile', 'experience', 'projects']:
            return "ERROR: Invalid table"
        
        try:
            if table == 'profile':
                data = repository.fetch_profile()
            elif table == 'experience':
                data = repository.fetch_experiences()
            else:
                data = repository.fetch_projects()
            
            return json.dumps(data, indent=2, default=str)
        except Exception as e:
            return f"ERROR: {str(e)}"
    
    return [execute_sql, fetch_current_state]


# ============================================================================
# AGENT STATE
# ============================================================================

class ResumeUpdateState(typing.TypedDict):
    resume_text: str
    current_db_data: Optional[dict]
    reasoning_output: Optional[str]
    sql_queries: List[str]
    final_summary: Optional[str]
    error_count: int
    max_retries: int
    messages: Annotated[List[BaseMessage], add_messages]  # Proper LangGraph annotation for message handling
    queries_executed: int
    is_complete: bool


# ============================================================================
# STRATEGY PATTERN (Single Responsibility Principle)
# ============================================================================

class ReasonerStrategy:
    """Strategy for reasoning node logic (Strategy Pattern, SRP)."""
    
    def __init__(
        self,
        llm_provider: ILLMProvider,
        repository: IDatabaseRepository,
        table_schema: dict
    ):
        self.llm = llm_provider
        self.repository = repository
        self.table_schema = table_schema
    
    def execute(self, state: ResumeUpdateState) -> dict:
        """Execute reasoning logic."""
        log("REASONER STRATEGY", "GRAPH")
        
        # Fetch current data if not already loaded
        if state.get("current_db_data") is None:
            print("\n" + "="*70)
            print("STEP 1: READING CURRENT DATABASE")
            print("="*70)
            current_data = self.repository.fetch_all()
            print(f"\n📊 Current Database State:")
            print(f"   Profile: {current_data['profile']['name'] if current_data.get('profile') else 'N/A'}")
            print(f"   Experience Records: {len(current_data.get('experience', []))}")
            print(f"   Project Records: {len(current_data.get('projects', []))}")
            
            print("\n" + "="*70)
            print("STEP 2: COMPARING RESUME WITH DATABASE")
            print("="*70)
            print(f"Resume Text Length: {len(state['resume_text'])} characters")
            print("\nGemini will now:")
            print("  1. Read and parse the resume text")
            print("  2. Compare each field with database")
            print("  3. Identify what's EXTRA or DIFFERENT in resume")
            print("  4. Generate SQL to update database")
        else:
            current_data = state["current_db_data"]
        
        # Build prompt
        planning_prompt = f"""GOAL: Update the database to match the resume. Find what is EXTRA or DIFFERENT in the resume.

CURRENT DATABASE STATE:
{json.dumps(current_data, indent=2, default=str)}

RESUME TEXT (SOURCE OF TRUTH):
{state['resume_text']}

DATABASE SCHEMA:
{json.dumps(self.table_schema, indent=2)}

YOUR TASK:
1. CAREFULLY read the resume text and extract all information
2. COMPARE each field in the resume with the current database
3. Identify what is MISSING in the database but present in resume
4. Identify what is DIFFERENT between resume and database
5. Generate SQL queries to UPDATE the database to match the resume

COMPARISON CHECKLIST:
- Profile: Check name, title, about_me (profile summary/description)
- Experience: Check all companies, roles, dates, locations, achievements
- Projects: Check all project titles, descriptions, tech stacks, links

SQL GENERATION RULES:
1. Generate UPDATE queries for existing records that have different values
2. Use UPDATE tablename SET field = 'value' WHERE id = X
3. For JSONB arrays (achievements, tech_stack): Use '["item1","item2"]'::jsonb format
4. For text with quotes: Use double single-quotes (it''s not its)
5. Do NOT update resume_url field
6. Compare CAREFULLY - only update if values are actually different
7. If a field in resume is longer/more detailed, UPDATE it
8. If resume has additional experience/projects not in DB, note them in changes

RESPONSE FORMAT (JSON only, no markdown):
{{
  "changes": ["description of each change"],
  "sql_queries": ["UPDATE query 1", "UPDATE query 2", ...]
}}

If database already matches resume exactly:
{{"changes": [], "sql_queries": []}}"""

        try:
            log("Calling Gemini...", "LLM")
            response = self.llm.invoke([
                SystemMessage(content="Generate minimal SQL. JSON only, no markdown."),
                HumanMessage(content=planning_prompt)
            ])
            
            # Handle Gemini's list-based response format
            response_text = response.content
            if isinstance(response_text, list):
                response_text = '\n'.join(
                    part.get('text', str(part)) if isinstance(part, dict) else str(part)
                    for part in response_text
                )
            
            print(f"\n🤖 Gemini Response ({len(response_text)} chars):")
            print(response_text[:800])
            if len(response_text) > 800:
                print("...")
            
            parsed = extract_json_from_text(response.content)
            queries = parsed.get("sql_queries", [])
            changes = parsed.get("changes", [])
            
            print("\n" + "="*70)
            print("STEP 3: COMPARISON RESULTS")
            print("="*70)
            print(f"\n📋 Changes Detected: {len(changes)}")
            
            if changes:
                print("\nWhat's EXTRA or DIFFERENT in Resume:")
                for i, c in enumerate(changes, 1):
                    print(f"   {i}. {c}")
            
            if not queries:
                print("\n✅ NO CHANGES NEEDED")
                print("Database already matches the resume perfectly!")
                return {
                    "current_db_data": current_data,
                    "sql_queries": [],
                    "final_summary": "No updates needed - database in sync",
                    "is_complete": True
                }
            
            print(f"\n💾 SQL Queries to Execute: {len(queries)}")
            print("\nSQL Updates:")
            for i, query in enumerate(queries, 1):
                print(f"   {i}. {query[:100]}...")
                
            print("\n" + "="*70)
            print("STEP 4: EXECUTING SQL UPDATES")
            print("="*70)
            
            # Setup executor messages
            exec_prompt = f"""Execute these SQL queries using the execute_sql tool:
{json.dumps(queries, indent=2)}

After all queries, verify with fetch_current_state. Start now."""

            return {
                "current_db_data": current_data,
                "sql_queries": queries,
                "reasoning_output": f"Found {len(changes)} changes. Generated {len(queries)} SQL queries.",
                "messages": [
                    SystemMessage(content="Execute SQL with tools. Call execute_sql for each query."),
                    HumanMessage(content=exec_prompt)
                ],
                "queries_executed": 0,
                "is_complete": False
            }
            
        except Exception as e:
            log(f"Reasoner error: {e}", "ERROR")
            import traceback
            traceback.print_exc()
            return {"error_count": state.get("error_count", 0) + 1, "is_complete": True}


class ExecutorStrategy:
    """Strategy for executor node logic (Strategy Pattern, SRP)."""
    
    def __init__(self, llm_provider: ILLMProvider):
        self.llm = llm_provider
    
    def execute(self, state: ResumeUpdateState) -> dict:
        """Execute SQL execution logic."""
        log("EXECUTOR STRATEGY", "GRAPH")
        
        messages = state.get("messages", [])
        queries_executed = state.get("queries_executed", 0)
        
        # Validate messages list
        if not messages:
            log("No messages in state - execution complete", "INFO")
            return {
                "final_summary": f"Completed with {queries_executed} queries",
                "is_complete": True,
                "queries_executed": queries_executed
            }
        
        # Safety limit
        if len(messages) > 30:
            log("Safety limit reached", "WARN")
            return {
                "final_summary": f"Completed with {queries_executed} queries",
                "is_complete": True,
                "messages": messages,
                "queries_executed": queries_executed
            }
        
        log(f"Invoking Gemini with {len(messages)} messages and tools", "LLM")
        response = self.llm.invoke(messages)
        
        print(f"\n🤖 Gemini Response:")
        if response.content:
            # Handle Gemini's list-based response format
            content_text = response.content
            if isinstance(content_text, list):
                content_text = '\n'.join(
                    part.get('text', str(part)) if isinstance(part, dict) else str(part)
                    for part in content_text
                )
            print(f"   Content: {content_text[:150]}...")
        
        if hasattr(response, 'tool_calls') and response.tool_calls:
            print(f"   🔧 Tool calls: {len(response.tool_calls)}")
            for tc in response.tool_calls:
                print(f"      {tc['name']}: {str(tc['args'])[:60]}...")
            queries_executed += len(response.tool_calls)
            
            # Still working - more tool calls to process
            messages.append(response)
            return {
                "messages": messages,
                "queries_executed": queries_executed,
                "is_complete": False
            }
        else:
            # No more tool calls - execution complete
            print("   ✅ No tool calls - execution complete")
            return {
                "messages": messages,
                "queries_executed": queries_executed,
                "final_summary": f"All updates completed successfully ({queries_executed} queries)",
                "is_complete": True
            }


# ============================================================================
# AGENT CLASS (Dependency Injection, follows all SOLID principles)
# ============================================================================

class ResumeUpdateAgent:
    """
    Agent that updates portfolio database from resume text using Google Gemini.
    
    Follows SOLID principles:
    - SRP: Only orchestrates the graph, delegates to strategies
    - OCP: Open to new providers/strategies via dependency injection
    - LSP: Depends on interfaces, not concrete implementations
    - ISP: Uses focused Protocol interfaces
    - DIP: High-level module depends on abstractions
    """
    
    def __init__(
        self,
        config: AgentConfig,
        llm_provider: ILLMProvider,
        repository: IDatabaseRepository,
        observer: Optional[IStateObserver] = None
    ):
        global VERBOSE
        VERBOSE = config.verbose
        
        self.config = config
        self.llm_provider = llm_provider
        self.repository = repository
        self.observer = observer or ConsoleStateObserver()
        
        self.table_schema = {
            "profile": {"columns": ["id", "name", "title", "about_me", "resume_url"]},
            "experience": {"columns": ["id", "company", "role", "start_date", "end_date", "location", "achievements"]},
            "projects": {"columns": ["id", "title", "description", "tech_stack", "repo_link", "live_link", "featured"]}
        }
        
        # Create strategies (Strategy Pattern)
        self.reasoner = ReasonerStrategy(llm_provider, repository, self.table_schema)
        
        # Create tools and bind to executor LLM (Dependency Injection)
        self.tools = create_database_tools(repository)
        self.executor = ExecutorStrategy(llm_provider.bind_tools(self.tools))
        
        self._build_graph()
        log("Agent initialized with Google Gemini", "SUCCESS")
        log(f"Model: {config.model_name}", "INFO")
    
    def _build_graph(self):
        """Build the LangGraph workflow."""
        log("Building graph...", "DEBUG")
        graph = StateGraph(ResumeUpdateState)
        
        graph.add_node("REASONER", self._reasoner_node)
        graph.add_node("SQL_EXECUTOR", self._executor_node)
        graph.add_node("TOOLS", ToolNode(self.tools))
        
        graph.set_entry_point("REASONER")
        
        graph.add_conditional_edges(
            "REASONER",
            self._route_after_reasoner,
            {"EXECUTE": "SQL_EXECUTOR", "END": END}
        )
        graph.add_conditional_edges(
            "SQL_EXECUTOR",
            self._route_after_executor,
            {"TOOLS": "TOOLS", "END": END}
        )
        graph.add_edge("TOOLS", "SQL_EXECUTOR")
        
        self.graph = graph.compile()
        log("Graph compiled successfully", "DEBUG")
    
    def _reasoner_node(self, state: ResumeUpdateState) -> dict:
        """Reasoner node - delegates to strategy."""
        print("\n" + "="*70)
        print("🧠 REASONER NODE")
        print("="*70)
        
        result = self.reasoner.execute(state)
        self.observer.on_state_change(result, "REASONER")
        return result
    
    def _executor_node(self, state: ResumeUpdateState) -> dict:
        """Executor node - delegates to strategy."""
        print("\n" + "="*70)
        print("💾 SQL EXECUTOR NODE")
        print("="*70)
        
        result = self.executor.execute(state)
        self.observer.on_state_change(result, "SQL_EXECUTOR")
        return result
    
    def _route_after_reasoner(self, state: ResumeUpdateState) -> str:
        """Route after reasoner node."""
        log("Routing after REASONER", "GRAPH")
        if state.get("is_complete"):
            log("-> END", "GRAPH")
            return "END"
        if state.get("sql_queries"):
            log("-> EXECUTE", "GRAPH")
            return "EXECUTE"
        log("-> END", "GRAPH")
        return "END"
    
    def _route_after_executor(self, state: ResumeUpdateState) -> str:
        """Route after executor node."""
        log("Routing after EXECUTOR", "GRAPH")
        
        # Check if execution is complete
        if state.get("is_complete"):
            log("-> END (is_complete=True)", "GRAPH")
            return "END"
        
        messages = state.get("messages", [])
        if not messages:
            log("-> END (no messages)", "GRAPH")
            return "END"
        
        last = messages[-1]
        if hasattr(last, 'tool_calls') and last.tool_calls:
            log("-> TOOLS", "GRAPH")
            return "TOOLS"
        
        log("-> END (no tool calls)", "GRAPH")
        return "END"
    
    def run(self, resume_text: str) -> dict:
        """Execute the agent workflow."""
        print("\n" + "="*80)
        print("🚀 RESUME UPDATE AGENT - GOOGLE GEMINI")
        print("="*80)
        print(f"📄 Resume: {len(resume_text)} chars")
        print(f"🤖 Model: {self.config.model_name}")
        
        initial_state = ResumeUpdateState(
            resume_text=resume_text,
            current_db_data=None,
            reasoning_output=None,
            sql_queries=[],
            final_summary=None,
            error_count=0,
            max_retries=self.config.max_retries,
            messages=[],
            queries_executed=0,
            is_complete=False
        )
        
        log("Starting graph execution", "INFO")
        print("\n📊 GRAPH EXECUTION:")
        
        final_state = None
        for event in self.graph.stream(initial_state, {"recursion_limit": 50}):
            for node, output in event.items():
                log(f"Node '{node}' completed", "GRAPH")
                final_state = output
        
        print("\n" + "="*80)
        print("✅ EXECUTION COMPLETED")
        print("="*80)
        
        summary = final_state.get("final_summary", "Done") if final_state else "Done"
        queries = final_state.get("queries_executed", 0) if final_state else 0
        sql_queries = final_state.get("sql_queries", []) if final_state else []
        reasoning = final_state.get("reasoning_output", "") if final_state else ""
        
        print(f"\n📊 EXECUTION SUMMARY:")
        print(f"   {reasoning}")
        print(f"   SQL Queries Executed: {queries}")
        print(f"   Status: {summary}")
        
        if sql_queries:
            print(f"\n💾 Database Updates Performed:")
            for i, query in enumerate(sql_queries, 1):
                print(f"   {i}. {query[:80]}...")
        
        return {
            "summary": summary,
            "queries_executed": queries,
            "final_state": final_state,
            "sql_queries": final_state.get("sql_queries", []) if final_state else [],
            "changes_detected": len(final_state.get("sql_queries", [])) > 0 if final_state else False
        }


def update_portfolio_from_resume(resume_text: str) -> dict:
    """
    Main entry point for updating portfolio from resume.
    
    Uses dependency injection to create agent with proper configuration.
    Follows SOLID principles with clean architecture.
    """
    # Load configuration from environment
    config = AgentConfig.from_env()
    
    if not config.database_url:
        raise ValueError("DATABASE_URL environment variable required")
    
    if not config.google_api_key:
        raise ValueError("GOOGLE_API_KEY environment variable required")
    
    # Create dependencies (Dependency Injection)
    repository = PortfolioDatabaseRepository(config.database_url)
    llm_provider = LLMProviderFactory.create_provider(config)
    observer = ConsoleStateObserver()
    
    # Create and run agent
    agent = ResumeUpdateAgent(
        config=config,
        llm_provider=llm_provider,
        repository=repository,
        observer=observer
    )
    
    return agent.run(resume_text)
