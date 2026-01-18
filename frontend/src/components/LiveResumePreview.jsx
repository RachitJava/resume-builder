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

// Sample dummy data if no data provided
const sampleData = {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "(555) 123-4567",
    location: "New York, NY",
    summary: "Experienced professional with a strong background in software development and project management.",
    skills: ["JavaScript", "React", "Java", "Spring Boot", "AWS", "SQL"],
    experience: [
        {
            position: "Senior Developer",
            company: "Tech Corp",
            startDate: "2020",
            endDate: "Present",
            highlights: ["Led team of 5 developers", "Improved system performance by 30%"]
        }
    ],
    education: [
        {
            degree: "B.S. Computer Science",
            institution: "State University",
            endDate: "2019"
        }
    ]
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
    const resumeData = data || sampleData;
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
