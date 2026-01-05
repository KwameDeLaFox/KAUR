'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles, AlertCircle, Download } from "lucide-react"
import { generateInsight, generatePresentationAction } from "@/lib/actions"
import ReactMarkdown from 'react-markdown'
import { Card, CardContent } from "@/components/ui/card"
import { JourneyMapTable } from "@/components/journey-map-table"

export function AnalysisForm({ projectId }: { projectId: number }) {
    const [goal, setGoal] = useState<string>("")
    const [type, setType] = useState<string>("Summary")
    const [result, setResult] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Persona Config State
    const [selectedSections, setSelectedSections] = useState<string[]>([
        "Demographics", "Pain Points", "Core Needs", "Behaviors"
    ]);
    const [customSection, setCustomSection] = useState("");

    // Journey Config State
    const [journeySections, setJourneySections] = useState<string[]>([
        "Objectives", "Needs", "Feelings", "Barriers"
    ]);
    const [customJourneySection, setCustomJourneySection] = useState("");
    const [journeyStages, setJourneyStages] = useState<string>("");

    // Presentation Config State
    const [selectedSlides, setSelectedSlides] = useState<string[]>([
        "Title Slide", "Key Findings", "User Insights", "Next Steps"
    ]);
    const [customSlide, setCustomSlide] = useState("");

    // Insights Config State
    const [insightCategories, setInsightCategories] = useState<string[]>([
        "Key Findings", "Pain Points", "Opportunities", "Recommendations"
    ]);
    const [customInsightCategory, setCustomInsightCategory] = useState("");

    const toggleSection = (section: string) => {
        if (selectedSections.includes(section)) {
            setSelectedSections(selectedSections.filter(s => s !== section));
        } else {
            setSelectedSections([...selectedSections, section]);
        }
    };

    const addCustomSection = () => {
        if (customSection.trim() && !selectedSections.includes(customSection.trim())) {
            setSelectedSections([...selectedSections, customSection.trim()]);
            setCustomSection("");
        }
    };

    const toggleJourneySection = (section: string) => {
        if (journeySections.includes(section)) {
            setJourneySections(journeySections.filter(s => s !== section));
        } else {
            setJourneySections([...journeySections, section]);
        }
    };

    const addCustomJourneySection = () => {
        if (customJourneySection.trim() && !journeySections.includes(customJourneySection.trim())) {
            setJourneySections([...journeySections, customJourneySection.trim()]);
            setCustomJourneySection("");
        }
    };

    const toggleSlide = (slide: string) => {
        if (selectedSlides.includes(slide)) {
            setSelectedSlides(selectedSlides.filter(s => s !== slide));
        } else {
            setSelectedSlides([...selectedSlides, slide]);
        }
    };

    const addCustomSlide = () => {
        if (customSlide.trim() && !selectedSlides.includes(customSlide.trim())) {
            setSelectedSlides([...selectedSlides, customSlide.trim()]);
            setCustomSlide("");
        }
    };

    const toggleInsightCategory = (category: string) => {
        if (insightCategories.includes(category)) {
            setInsightCategories(insightCategories.filter(c => c !== category));
        } else {
            setInsightCategories([...insightCategories, category]);
        }
    };

    const addCustomInsightCategory = () => {
        if (customInsightCategory.trim() && !insightCategories.includes(customInsightCategory.trim())) {
            setInsightCategories([...insightCategories, customInsightCategory.trim()]);
            setCustomInsightCategory("");
        }
    };

    async function handleGenerate() {
        setLoading(true)
        setError(null)
        try {
            if (type === 'Presentation') {
                const options = { slides: selectedSlides };
                await generatePresentationAction(projectId, options);
                setResult("Presentation generated successfully! It has been added to your project files list above.");
            } else {
                // Pass options if type is Persona or Journey
                const options: any = type === 'Persona' ? { sections: selectedSections } :
                    type === 'Journey' ? {
                        sections: journeySections,
                        stages: journeyStages ? journeyStages.split(',').map(s => s.trim()) : undefined
                    } : type === 'Insights' ? { categories: insightCategories } : {};
                const output = await generateInsight(projectId, goal, type, options)
                setResult(output)
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Something went wrong during generation.")
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!result) return;
        const blob = new Blob([result], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type.toLowerCase()}-analysis.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="goal">Goal / Prompt (Optional)</Label>
                    <Textarea
                        id="goal"
                        placeholder="e.g. Identify the top 3 user pain points regarding the login flow."
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="type">Output Type</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select output" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Summary">Summary</SelectItem>
                            <SelectItem value="Prompt">Prompt</SelectItem>
                            <SelectItem value="Persona">User Persona</SelectItem>
                            <SelectItem value="Journey">User Journey Map</SelectItem>
                            <SelectItem value="Brief">Research Brief</SelectItem>
                            <SelectItem value="Insights">Document Insights</SelectItem>
                            <SelectItem value="Presentation">Presentation Deck</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {type === 'Persona' && (
                    <div className="p-4 border rounded-md bg-muted/20 space-y-3">
                        <Label>Persona Configuration</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                "Demographics", "Bio", "Goals", "Pain Points",
                                "Frustrations", "Motivations", "Personality",
                                "Preferred Channels", "Brands / Influences",
                                "Tech Proficiency", "Day in the Life", "Quote",
                                "Core Needs", "Behaviors"
                            ].map(section => (
                                <div key={section} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={section}
                                        checked={selectedSections.includes(section)}
                                        onChange={() => toggleSection(section)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={section} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {section}
                                    </label>
                                </div>
                            ))}
                            {/* Render custom sections that aren't in the default list */}
                            {selectedSections.filter(s => ![
                                "Demographics", "Bio", "Goals", "Pain Points",
                                "Frustrations", "Motivations", "Personality",
                                "Preferred Channels", "Brands / Influences",
                                "Tech Proficiency", "Day in the Life", "Quote",
                                "Core Needs", "Behaviors"
                            ].includes(s)).map(section => (
                                <div key={section} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={section}
                                        checked={true}
                                        onChange={() => toggleSection(section)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={section} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {section} (Custom)
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <input
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Add custom section..."
                                    value={customSection}
                                    onChange={(e) => setCustomSection(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCustomSection();
                                        }
                                    }}
                                />
                                <Button size="sm" variant="secondary" onClick={addCustomSection} type="button">
                                    +
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                AI will attempt to understand custom sections even with minor typos.
                            </p>
                        </div>
                    </div>
                )}

                {type === 'Journey' && (
                    <div className="p-4 border rounded-md bg-muted/20 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-primary font-bold">X-Axis (Stages / Columns)</Label>
                            <input
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g. Discovery, Consideration, Conversion (Optional)"
                                value={journeyStages}
                                onChange={(e) => setJourneyStages(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Leave blank for AI to determine logical stages, or comma-separate your own.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-primary font-bold">Y-Axis (Swimlanes / Rows)</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    "Objectives", "Needs", "Feelings", "Barriers",
                                    "Touchpoints", "Quotes", "Ownership", "Solutions",
                                    "Tech Stack", "Data Points", "Exit Criteria"
                                ].map(section => (
                                    <div key={section} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`journey-${section}`}
                                            checked={journeySections.includes(section)}
                                            onChange={() => toggleJourneySection(section)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor={`journey-${section}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {section}
                                        </label>
                                    </div>
                                ))}
                                {/* Render custom sections that aren't in the default list */}
                                {journeySections.filter(s => ![
                                    "Objectives", "Needs", "Feelings", "Barriers",
                                    "Touchpoints", "Quotes", "Ownership", "Solutions",
                                    "Tech Stack", "Data Points", "Exit Criteria"
                                ].includes(s)).map(section => (
                                    <div key={`journey-${section}`} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`journey-${section}`}
                                            checked={true}
                                            onChange={() => toggleJourneySection(section)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor={`journey-${section}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {section} (Custom)
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1">
                                <div className="flex gap-2">
                                    <input
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Add custom swimlane..."
                                        value={customJourneySection}
                                        onChange={(e) => setCustomJourneySection(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addCustomJourneySection();
                                            }
                                        }}
                                    />
                                    <Button size="sm" variant="secondary" onClick={addCustomJourneySection} type="button">
                                        +
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    AI will map research data to your custom swimlanes.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {type === 'Insights' && (
                    <div className="p-4 border rounded-md bg-muted/20 space-y-3">
                        <Label>Insights Configuration</Label>
                        <p className="text-sm text-muted-foreground">Select which categories of insights to extract from your documents:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                "Key Findings", "Pain Points", "Opportunities", "Recommendations",
                                "Trends", "Risks", "User Needs", "Behavioral Patterns",
                                "Competitive Insights", "Feature Requests"
                            ].map(category => (
                                <div key={category} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`insight-${category}`}
                                        checked={insightCategories.includes(category)}
                                        onChange={() => toggleInsightCategory(category)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={`insight-${category}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {category}
                                    </label>
                                </div>
                            ))}
                            {/* Custom categories */}
                            {insightCategories.filter(c => ![
                                "Key Findings", "Pain Points", "Opportunities", "Recommendations",
                                "Trends", "Risks", "User Needs", "Behavioral Patterns",
                                "Competitive Insights", "Feature Requests"
                            ].includes(c)).map(category => (
                                <div key={`insight-${category}`} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`insight-${category}`}
                                        checked={true}
                                        onChange={() => toggleInsightCategory(category)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={`insight-${category}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {category} (Custom)
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <input
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Add custom insight category..."
                                    value={customInsightCategory}
                                    onChange={(e) => setCustomInsightCategory(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCustomInsightCategory();
                                        }
                                    }}
                                />
                                <Button size="sm" variant="secondary" onClick={addCustomInsightCategory} type="button">
                                    +
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Each insight includes evidence from your documents and a confidence rating.
                            </p>
                        </div>
                    </div>
                )}

                {type === 'Presentation' && (
                    <div className="p-4 border rounded-md bg-muted/20 space-y-3">
                        <Label>Presentation Configuration</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                "Title Slide", "Executive Summary", "Key Findings",
                                "User Insights", "Pain Points", "Opportunities",
                                "Recommendations", "Next Steps", "Methodology",
                                "Timeline", "Q&A Slide"
                            ].map(slide => (
                                <div key={slide} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={slide}
                                        checked={selectedSlides.includes(slide)}
                                        onChange={() => toggleSlide(slide)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={slide} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {slide}
                                    </label>
                                </div>
                            ))}
                            {/* Render custom slides that aren't in the default list */}
                            {selectedSlides.filter(s => ![
                                "Title Slide", "Executive Summary", "Key Findings",
                                "User Insights", "Pain Points", "Opportunities",
                                "Recommendations", "Next Steps", "Methodology",
                                "Timeline", "Q&A Slide"
                            ].includes(s)).map(slide => (
                                <div key={slide} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={slide}
                                        checked={true}
                                        onChange={() => toggleSlide(slide)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={slide} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {slide} (Custom)
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <input
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Add custom slide type..."
                                    value={customSlide}
                                    onChange={(e) => setCustomSlide(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCustomSlide();
                                        }
                                    }}
                                />
                                <Button size="sm" variant="secondary" onClick={addCustomSlide} type="button">
                                    +
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                AI will create slides based on your selected types and the research context.
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}

                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" /> Generate {type}
                        </>
                    )}
                </Button>
            </div>

            {result && (
                <div className="mt-8 space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Result</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(result)}>
                                Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-1" /> Save
                            </Button>
                        </div>
                    </div>
                    <Card className="bg-muted/30">
                        <CardContent className="pt-6 prose dark:prose-invert max-w-none text-sm p-4">
                            {type === 'Journey' && result && !result.startsWith("Error") ? (
                                (() => {
                                    try {
                                        const clean = result.replace(/```json/g, '').replace(/```/g, '');
                                        const parsed = JSON.parse(clean);
                                        return <JourneyMapTable data={parsed} />;
                                    } catch (e) {
                                        return <ReactMarkdown>{result}</ReactMarkdown>;
                                    }
                                })()
                            ) : (
                                <ReactMarkdown>{result}</ReactMarkdown>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
