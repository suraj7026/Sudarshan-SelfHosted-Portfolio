import React, { useState, useEffect } from 'react';
import { IconType } from 'react-icons';
import { FaPython, FaJava, FaJs, FaReact, FaHtml5, FaGitAlt, FaAws, FaDocker, FaLinux, FaRobot, FaBrain, FaDatabase, FaCode, FaLanguage, FaMagic, FaLink, FaSitemap, FaChartLine, FaPlug, FaCubes, FaGithub, FaServer, FaInfinity, FaCloud } from 'react-icons/fa';
import { SiGo, SiTypescript, SiPostgresql, SiTensorflow, SiPytorch, SiOpenai, SiDjango, SiFastapi, SiCplusplus } from 'react-icons/si';
import { fetchSkills, Skill as SkillType } from '../services/api';

// Define Interface
interface SkillItem {
    id: number;
    name: string;
    category: string;
    description: string;
    icon: React.ReactNode;
}

// Helper to bypass TS JSX type errors with React 19 + react-icons
const Icon = (Component: IconType, color: string) => React.createElement(Component as any, { color, size: 48 });

// Icon mapping based on icon_name from database
const iconMap: Record<string, IconType> = {
    'python': FaPython,
    'java': FaJava,
    'go': SiGo,
    'javascript': FaJs,
    'typescript': SiTypescript,
    'react': FaReact,
    'nodejs': FaJs,
    'html5': FaHtml5,
    'django': SiDjango,
    'fastapi': SiFastapi,
    'aws': FaAws,
    'docker': FaDocker,
    'postgresql': SiPostgresql,
    'tensorflow': SiTensorflow,
    'pytorch': SiPytorch,
    'openai': SiOpenai,
    'git': FaGitAlt,
    'linux': FaLinux,
    'azuredevops': FaCloud,
    'cpp': SiCplusplus,
    'database': FaDatabase,
    'brain': FaBrain,
    'robot': FaRobot,
    'language': FaLanguage,
    'code': FaCode,
    'magic': FaMagic,
    'link': FaLink,
    'sitemap': FaSitemap,
    'chart': FaChartLine,
    'api': FaCode,
    'plug': FaPlug,
    'cubes': FaCubes,
    'github': FaGithub,
    'azure': FaCloud,
    'server': FaServer,
    'infinity': FaInfinity,
};

// Get icon from mapping or fallback to FaCode
const getIcon = (iconName: string, color: string): React.ReactNode => {
    const IconComponent = iconMap[iconName.toLowerCase()] || FaCode;
    return Icon(IconComponent, color);
};

const Skills: React.FC = () => {
    const [allSkills, setAllSkills] = useState<SkillItem[]>([]);
    const [filteredSkills, setFilteredSkills] = useState<SkillItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [loading, setLoading] = useState(true);
    const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

    useEffect(() => {
        const loadSkills = async () => {
            const data = await fetchSkills();
            // Transform API data to component format
            const transformedSkills: SkillItem[] = data.map((skill: SkillType) => ({
                id: skill.id,
                name: skill.skill,
                category: skill.category,
                description: skill.description,
                icon: getIcon(skill.icon_name, skill.icon_color),
            }));
            setAllSkills(transformedSkills);
            setFilteredSkills(transformedSkills);
            
            // Extract unique categories
            const uniqueCategories = Array.from(new Set(data.map((skill: SkillType) => skill.category)));
            setCategories(uniqueCategories);
            
            setLoading(false);
        };
        loadSkills();
    }, []);

    // Filter skills when category changes
    useEffect(() => {
        if (selectedCategory === 'All') {
            setFilteredSkills(allSkills);
        } else {
            setFilteredSkills(allSkills.filter(skill => skill.category === selectedCategory));
        }
    }, [selectedCategory, allSkills]);

    // Scroll handlers
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320; // Card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return (
            <section id="skills" className="section bg-secondary">
                <div className="container">
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        Loading skills...
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="skills" className="section bg-secondary">
            <div className="container" style={{ overflow: 'visible' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{ marginBottom: 0 }}>
                        <div style={{
                            color: 'var(--color-accent)',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: 'var(--spacing-xs)'
                        }}>
                            / MY SKILLS
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
                            My extensive list of skills
                        </h2>
                    </div>

                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button onClick={() => scroll('left')} className="nav-btn" aria-label="Scroll Left">
                            &#8249;
                        </button>
                        <button onClick={() => scroll('right')} className="nav-btn" aria-label="Scroll Right">
                            &#8250;
                        </button>
                    </div>
                </div>

                {/* Category Filter Pills */}
                <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: 'var(--spacing-xl)',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start'
                }}>
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className="project-tag-pill"
                        style={{
                            cursor: 'pointer',
                            border: 'none',
                            backgroundColor: selectedCategory === 'All' ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.08)',
                            color: selectedCategory === 'All' ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        All
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className="project-tag-pill"
                            style={{
                                cursor: 'pointer',
                                border: 'none',
                                backgroundColor: selectedCategory === category ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.08)',
                                color: selectedCategory === category ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Horizontal Carousel */}
                <div className="skills-container animate-fade-up">
                    <div className="skills-carousel" ref={scrollContainerRef}>
                        {filteredSkills.map((skill) => (
                            <div
                                key={skill.id}
                                className="skill-card-single"
                                onMouseEnter={() => setHoveredSkill(skill.name)}
                                onMouseLeave={() => setHoveredSkill(null)}
                            >
                                {/* Default Content */}
                                <div className={`skill-content-default ${hoveredSkill === skill.name ? 'hidden' : ''}`}>
                                    <div className="skill-icon-wrapper">
                                        {skill.icon}
                                    </div>
                                    <h3 className="skill-name">{skill.name}</h3>
                                    <p className="skill-desc">{skill.description}</p>
                                    <div className="skill-line"></div>
                                </div>

                                {/* Hover Reveal Content (Category) */}
                                <div className={`skill-content-hover ${hoveredSkill === skill.name ? 'visible' : ''}`}>
                                    <div className="skill-category-label">CATEGORY</div>
                                    <h3 className="skill-category-title">{skill.category}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Skills;
