import React, { useEffect, useRef, useState } from 'react';
import { IconType } from 'react-icons';
import { FaPython, FaJava, FaJs, FaReact, FaHtml5, FaGitAlt, FaAws, FaDocker, FaLinux, FaRobot, FaBrain, FaDatabase, FaCode, FaLanguage, FaMagic, FaLink, FaSitemap, FaChartLine, FaPlug, FaCubes, FaGithub, FaServer, FaInfinity, FaCloud } from 'react-icons/fa';
import { SiGo, SiTypescript, SiPostgresql, SiTensorflow, SiPytorch, SiOpenai, SiDjango, SiFastapi, SiCplusplus } from 'react-icons/si';
import { fetchSkills, Skill as SkillType } from '../services/api';
import { Reveal, SectionHeader, ParallaxWord } from './metro';
import skillsSnapshot from '../data/skills.json';

interface SkillItem {
  id: number;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
}

// Helper to bypass TS JSX type errors with React 19 + react-icons
const Icon = (Component: IconType, color: string) =>
  React.createElement(Component as any, { color, size: 16 });

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

const getIcon = (iconName: string, color: string): React.ReactNode => {
  const IconComponent = iconMap[iconName.toLowerCase()] || FaCode;
  return Icon(IconComponent, color);
};

const Skills: React.FC = () => {
  const skillStrip = useRef<HTMLDivElement>(null);
  const [allSkills, setAllSkills] = useState<SkillItem[]>(skillsSnapshot.map(skill => ({
    id: skill.id, name: skill.skill, category: skill.category,
    description: skill.description, icon: getIcon(skill.icon_name, skill.icon_color),
  })));
  const [categories, setCategories] = useState<string[]>(Array.from(new Set(skillsSnapshot.map(skill => skill.category))));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const loadSkills = async () => {
      const data = await fetchSkills();
      setAllSkills(
        data.map((skill: SkillType) => ({
          id: skill.id,
          name: skill.skill,
          category: skill.category,
          description: skill.description,
          icon: getIcon(skill.icon_name, skill.icon_color),
        }))
      );
      setCategories(Array.from(new Set(data.map((skill: SkillType) => skill.category))));
    };
    loadSkills();
  }, []);

  const filteredSkills =
    selectedCategory === 'all'
      ? allSkills
      : allSkills.filter((skill) => skill.category === selectedCategory);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    skillStrip.current?.scrollTo({ left: 0 });
  };

  const scrollSkills = (direction: number) => {
    const strip = skillStrip.current;
    if (strip) strip.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section id="skills" className="metro-section">
      <ParallaxWord word="skills" />
      <div className="container">
        <Reveal>
          <SectionHeader title="skills" />
        </Reveal>

        {/* WP10-style pivot tabs */}
        <Reveal delay={0.1}>
          <div className="metro-pivot" role="group" aria-label="Skill categories">
            <button
              type="button"
              className={`metro-pivot-item${selectedCategory === 'all' ? ' metro-pivot-item--active' : ''}`}
              aria-pressed={selectedCategory === 'all'}
              onClick={() => selectCategory('all')}
            >
              all
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`metro-pivot-item${selectedCategory === category ? ' metro-pivot-item--active' : ''}`}
                aria-pressed={selectedCategory === category}
                onClick={() => selectCategory(category)}
              >
                {category.toLowerCase()}
              </button>
            ))}
          </div>
        </Reveal>

        <div id="skill-strip" ref={skillStrip} className="metro-skill-grid" role="region" aria-label="Skills, horizontally scrollable" tabIndex={0}>
          {filteredSkills.map((skill, index) => (
            <div key={skill.id} className={`metro-skill-item${index % 10 === 0 ? ' metro-skill-item--large' : index % 10 === 4 ? ' metro-skill-item--wide' : ''}`}>
              <div
                className="skill-flip"
                tabIndex={0}
                aria-label={`${skill.name} — ${skill.category}`}
              >
                <div className="skill-flip-inner">
                  <div className="skill-face skill-face-front">
                    <h3 className="skill-name">{skill.name}</h3>
                    <p className="skill-desc">{skill.description}</p>
                    <span className="skill-glyph" aria-hidden="true">
                      {skill.icon}
                    </span>
                  </div>
                  <div className="skill-face skill-face-back" aria-hidden="true">
                    <span className="skill-category-label">category</span>
                    <span className="skill-category">{skill.category.toLowerCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="metro-skill-controls" aria-label="Scroll skills">
          <span>scroll to explore</span>
          <div>
            <button type="button" onClick={() => scrollSkills(-1)} aria-label="Scroll skills left" aria-controls="skill-strip">←</button>
            <button type="button" onClick={() => scrollSkills(1)} aria-label="Scroll skills right" aria-controls="skill-strip">→</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
