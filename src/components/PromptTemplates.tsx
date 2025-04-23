"use client";

import React, { useState } from 'react';

const CATEGORIES = [
  "Writing",
  "Creativity",
  "Code",
  "Learning",
  "Problem Solving",
  "All"
];

const TEMPLATES = [
  {
    title: "Creative Story",
    prompt: "Write a creative short story about a world where AI and humans collaborate to solve environmental challenges.",
    category: "Creativity"
  },
  {
    title: "Code Review",
    prompt: "Review this code and suggest improvements for readability, performance, and error handling:\n\n```\n// Paste your code here\n```",
    category: "Code"
  },
  {
    title: "Study Plan",
    prompt: "Create a 30-day study plan for learning artificial intelligence fundamentals, including resources and daily goals.",
    category: "Learning"
  },
  {
    title: "Explain Concept",
    prompt: "Explain the concept of [topic] in simple terms, as if you were teaching it to a beginner.",
    category: "Learning"
  },
  {
    title: "Debug Help",
    prompt: "I'm getting this error in my code. Can you help me understand what's wrong and how to fix it?\n\nError: [paste error]\nCode: [paste code]",
    category: "Problem Solving"
  },
  {
    title: "Blog Post",
    prompt: "Write a comprehensive blog post about [topic] that includes an introduction, key points, and a conclusion.",
    category: "Writing"
  },
  {
    title: "Compare Technologies",
    prompt: "Compare and contrast [Technology A] and [Technology B] in terms of features, performance, use cases, and limitations.",
    category: "Learning"
  },
  {
    title: "Generate Test Cases",
    prompt: "Generate comprehensive test cases for a function that [describe function purpose].",
    category: "Code"
  },
  {
    title: "Brainstorm Ideas",
    prompt: "Help me brainstorm 10 creative ideas for [project/problem].",
    category: "Creativity"
  },
  {
    title: "Step-by-Step Guide",
    prompt: "Create a detailed step-by-step guide on how to [specific task].",
    category: "Problem Solving"
  }
];

interface PromptTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

export default function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  const filteredTemplates = activeCategory === "All" 
    ? TEMPLATES 
    : TEMPLATES.filter(template => template.category === activeCategory);

  // Handle category change with explicit prevention of form submission
  const handleCategoryChange = (e: React.MouseEvent, category: string) => {
    e.preventDefault(); // Prevent any form submission
    e.stopPropagation(); // Stop event propagation
    setActiveCategory(category);
  };

  // Template selection with explicit prevention of form submission
  const handleTemplateSelect = (e: React.MouseEvent, template: string) => {
    e.preventDefault(); // Prevent any form submission
    e.stopPropagation(); // Stop event propagation
    onSelectTemplate(template);
  };

  return (
    <div className="py-3 px-4">
      <h3 className="text-base font-medium mb-3 text-[rgba(229,231,235,0.95)]">Prompt Templates</h3>
      
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={(e) => handleCategoryChange(e, category)}
            type="button" // Explicitly set type to button to prevent form submission
            className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
              activeCategory === category
                ? 'bg-[rgba(45,226,230,0.15)] text-[rgba(45,226,230,0.9)] border border-[rgba(45,226,230,0.5)]'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(229,231,235,0.7)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Templates grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2">
        {filteredTemplates.map((template, index) => (
          <div 
            key={index}
            onClick={(e) => handleTemplateSelect(e, template.prompt)}
            className="cursor-pointer p-3 rounded-md bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(45,226,230,0.1)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(45,226,230,0.3)] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-[rgba(229,231,235,0.95)]">{template.title}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(45,226,230,0.1)] text-[rgba(45,226,230,0.7)]">
                {template.category}
              </span>
            </div>
            <p className="text-xs text-[rgba(229,231,235,0.7)] line-clamp-2">
              {template.prompt}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 