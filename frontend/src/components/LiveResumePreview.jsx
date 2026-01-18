import React, { useMemo, useEffect, useRef } from 'react';
import {
    ModernTemplate,
    ClassicTemplate,
    MinimalTemplate,
    ExecutiveTemplate,
    CreativeTemplate,
    AtsTemplate,
    AtsCleanTemplate,
    AtsBoldTemplate,
    AtsCompactTemplate,
    TwoColumnTemplate,
    DeveloperTemplate
} from './ResumePreview.jsx';

// =========================================================================
// RICH SAMPLE DATASETS FOR PREVIEWS
// =========================================================================

const profiles = {
    softwareEng: {
        fullName: "Alex Rivera",
        email: "alex.rivera@example.com",
        phone: "(555) 123-4567",
        location: "San Francisco, CA",
        linkedIn: "linkedin.com/in/alexrivera",
        github: "github.com/alexrivera",
        website: "alexrivera.dev",
        summary: "Senior Full Stack Engineer with 6+ years of experience building scalable microservices and responsive web applications. Expert in React, Node.js, and cloud infrastructure. Passionate about code quality, performance optimization, and developer productivity tools.",
        skills: ["JavaScript (ES6+)", "TypeScript", "React & Redux", "Node.js", "Python", "AWS (Lambda, S3, EC2)", "Docker & Kubernetes", "PostgreSQL", "GraphQL", "CI/CD Pipelines", "System Architecture"],
        experience: [
            {
                position: "Senior Software Engineer",
                company: "TechNova Solutions",
                startDate: "2021",
                endDate: "Present",
                description: "Leading the core product team in rebuilding the legacy monolith into specific microservices, improving system reliability by 99.9%.",
                highlights: [
                    "Architected and deployed a new payment processing systyem processing $5M+ monthly volume.",
                    "Mentored 4 junior developers and established code review standards.",
                    "Reduced page load times by 40% through code splitting and asset optimization."
                ]
            },
            {
                position: "Software Developer",
                company: "CloudScale Inc.",
                startDate: "2018",
                endDate: "2021",
                description: "Full stack development for a high-growth SaaS platform serving enterprise clients.",
                highlights: [
                    "Implemented real-time collaboration features using WebSockets and Redis.",
                    "Developed public-facing REST APIs consumed by mobile and third-party integrations.",
                    "Automated deployment workflows using Jenkins and Docker."
                ]
            },
            {
                position: "Junior Web Developer",
                company: "Creative Agency XYZ",
                startDate: "2016",
                endDate: "2018",
                description: "Built responsive websites and e-commerce stores for diverse client base.",
                highlights: [
                    "Delivered 15+ client projects on time and within budget.",
                    "Collaborated with designers to ensure pixel-perfect implementation of UI/UX."
                ]
            }
        ],
        education: [
            {
                degree: "B.S. Computer Science",
                institution: "University of California, Berkeley",
                startDate: "2012",
                endDate: "2016",
                gpa: "3.8"
            }
        ],
        projects: [
            {
                name: "AI Code Assistant",
                description: "Open source IDE extension using LLMs to suggest code completions.",
                technologies: ["TypeScript", "VS Code API", "OpenAI"]
            },
            {
                name: "TaskMaster",
                description: "Kanban-style project management tool with offline sync.",
                technologies: ["React", "Firebase", "PWA"]
            }
        ]
    },
    marketing: {
        fullName: "Sarah Jenkins",
        email: "sarah.j@example.com",
        phone: "(555) 987-6543",
        location: "Chicago, IL",
        linkedIn: "linkedin.com/in/sarahjenkins",
        summary: "Results-driven Marketing Manager with a proven track record of increasing brand awareness and driving revenue growth. Skilled in digital strategy, content marketing, and data analytics. Adept at leading cross-functional teams to execute multi-channel campaigns.",
        skills: ["Digital Strategy", "SEO/SEM", "Content Marketing", "Google Analytics", "Social Media Management", "Email Automation (HubSpot)", "Brand Development", "Market Research", "Copywriting", "Team Leadership"],
        experience: [
            {
                position: "Marketing Manager",
                company: "GrowthUp Startups",
                startDate: "2020",
                endDate: "Present",
                description: "Oversee all marketing initiatives including organic, paid, and partnership channels.",
                highlights: [
                    "Increased inbound leads by 150% YoY through targeted SEO and content stratgies.",
                    "Managed a $50k monthly ad budget across Google Ads and LinkedIn, achieving a 4x ROAS.",
                    "Launched a successful referral program that contributed 20% of new revenue in Q1 2023."
                ]
            },
            {
                position: "Content Specialist",
                company: "MediaHouse Agency",
                startDate: "2017",
                endDate: "2020",
                description: "Created compelling content for B2B technology clients.",
                highlights: [
                    "Wrote and published 50+ blog posts, whitepapers, and case studies.",
                    "Grew client social media engagement by 300% in the first year.",
                    "Coordinate webinar series attracting 1000+ qualified attendees."
                ]
            }
        ],
        education: [
            {
                degree: "B.A. Marketing & Communications",
                institution: "Northwestern University",
                startDate: "2013",
                endDate: "2017",
                gpa: "3.9"
            }
        ],
        certifications: [
            "Google Analytics Certified",
            "HubSpot Inbound Marketing",
            "Facebook Blueprint Certification"
        ]
    },
    executive: {
        fullName: "James Stirling",
        email: "j.stirling@example.com",
        phone: "+1 (555) 555-0199",
        location: "London, UK / Remote",
        linkedIn: "linkedin.com/in/jstirling-exec",
        summary: "Strategic Operations Executive with 15+ years of experience scaling global teams and optimizing business processes. Expert in change management, P&L ownership, and strategic planning. Dedicated to driving operational excellence and sustainable growth.",
        skills: ["Strategic Planning", "P&L Management", "Global Operations", "Change Management", "Stakeholder Relations", "Process Optimization", "M&A Integration", "Executive Leadership", "Risk Management"],
        experience: [
            {
                position: "VP of Operations",
                company: "Global Logistics Int.",
                startDate: "2018",
                endDate: "Present",
                description: "Direct global operations across 3 continents, managing a team of 150+ employees.",
                highlights: [
                    "Spearheaded digital transformation initiative reducing operational costs by 22% ($12M annually).",
                    "Led integration of two acquired competitors, unifying culture and systems within 6 months.",
                    "Improved customer satisfaction scores (NPS) from 45 to 72 through process re-engineering."
                ]
            },
            {
                position: "Director of Supply Chain",
                company: "Retail Giant Co.",
                startDate: "2012",
                endDate: "2018",
                description: "Managed end-to-end supply chain logicstics for a Fortune 500 retailer.",
                highlights: [
                    "Optimized inventory turnover ratio by 1.5x, freeing up $5M in working capital.",
                    "Negotiated strategic partnerships with key logistics providers, securing 15% better rates.",
                    "Implemented sustainability program reducing carbon footprint by 10%."
                ]
            }
        ],
        education: [
            {
                degree: "Master of Business Administration (MBA)",
                institution: "London Business School",
                startDate: "2010",
                endDate: "2012"
            },
            {
                degree: "B.S. Industrial Engineering",
                institution: "Georgia Institute of Technology",
                startDate: "2004",
                endDate: "2008"
            }
        ]
    }
};

// Map template names to imported components
const templates = {
    modern: ModernTemplate,
    classic: ClassicTemplate,
    minimal: MinimalTemplate,
    executive: ExecutiveTemplate,
    creative: CreativeTemplate,
    ats: AtsTemplate,
    atsclean: AtsCleanTemplate,
    atsbold: AtsBoldTemplate,
    atscompact: AtsCompactTemplate,
    twocolumn: TwoColumnTemplate,
    developer: DeveloperTemplate,
};

const ScaledPreview = ({ template, data, className }) => {
    // Select sample profile based on template name to ensure variety but consistency
    const getSampleProfile = (templateName) => {
        if (!templateName) return profiles.softwareEng;

        const t = templateName.toLowerCase();
        if (t.includes('executive') || t.includes('classic') || t.includes('ats')) return profiles.executive;
        if (t.includes('creative') || t.includes('two') || t.includes('marketing')) return profiles.marketing;
        return profiles.softwareEng; // Default for Modern, Developer, Minimal
    };

    const resumeData = data || getSampleProfile(template);
    const TemplateComponent = templates[template] || ModernTemplate;
    const containerRef = useRef(null);
    const contentRef = useRef(null);

    // A4 dimensions in px (standard roughly)
    const A4_WIDTH = 794;
    const A4_HEIGHT = 1123;

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && contentRef.current) {
                const parentWidth = containerRef.current.offsetWidth;
                const scale = parentWidth / A4_WIDTH;
                contentRef.current.style.transform = `scale(${scale})`;
            }
        };

        // Initial calcl
        handleResize();

        // Resize observer for robustness
        const observer = new ResizeObserver(handleResize);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className={`relative bg-white overflow-hidden pointer-events-none select-none ${className}`}>
            {/* Aspect Ratio Box (A4 is ~1.414) */}
            <div style={{ paddingBottom: '141.4%' }} />

            {/* Absolute Content */}
            <div className="absolute inset-0 w-full h-full">
                <div
                    ref={contentRef}
                    style={{
                        width: `${A4_WIDTH}px`,
                        height: `${A4_HEIGHT}px`,
                        transformOrigin: 'top left',
                    }}
                    className="bg-white"
                >
                    {/* Scale content a bit to fill the page nicely even with padding */}
                    <div className="p-8 h-full bg-white">
                        <TemplateComponent resume={{ ...resumeData, template }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScaledPreview;
