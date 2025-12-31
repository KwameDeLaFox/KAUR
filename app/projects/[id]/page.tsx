
import { getProject, deleteFile } from "@/lib/actions"
import { notFound } from "next/navigation"
import { UploadZone } from "@/components/upload-zone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Film, Music, Trash2, ArrowLeft, Download, UploadCloud, Sparkles } from "lucide-react"
import Link from "next/link"
import { AnalysisForm } from "@/components/analysis-form"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params for next.js 15+ compat (dynamic routes)
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    if (isNaN(id)) notFound()

    const project = await getProject(id)
    if (!project) notFound()

    function getIcon(type: string) {
        if (type.startsWith('video')) return <Film className="h-4 w-4" />
        if (type.startsWith('audio')) return <Music className="h-4 w-4" />
        return <FileText className="h-4 w-4" />
    }

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" size="sm" className="mb-4 pl-0" asChild>
                    <Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground">{project.description || "No description provided."}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-4 lg:items-start">
                {/* Sidebar Explorer */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Research Context Section */}
                    <Card className="border-l-4 border-l-blue-500 overflow-hidden">
                        <CardHeader className="pb-3 text-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <UploadCloud className="h-4 w-4 text-blue-500" />
                                        Research Context
                                    </CardTitle>
                                </div>
                                <div className="text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                                    {project.files.filter(f => !f.is_generated).length}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <UploadZone projectId={project.id} />

                            <div className="space-y-2">
                                {project.files.filter(f => !f.is_generated).map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-blue-50/30 dark:bg-blue-950/20 border-l-2 border-l-blue-400">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md shrink-0">
                                                {getIcon(file.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-medium truncate">{file.name}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <form action={deleteFile.bind(null, file.id, project.id)}>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                                {project.files.filter(f => !f.is_generated).length === 0 && (
                                    <p className="text-xs text-center text-muted-foreground py-4">No files yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>


                    {/* Generated Insights Section (Compact) */}
                    <Card className="border-l-4 border-l-green-500 overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-green-500" />
                                    Insights
                                </CardTitle>
                                <div className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">
                                    {project.files.filter(f => f.is_generated).length}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {project.files.filter(f => f.is_generated).map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-green-50/30 dark:bg-green-950/20 border-l-2 border-l-green-400">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-md shrink-0">
                                            {getIcon(file.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-medium truncate">{file.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Link href={`/${file.path}`} download>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600">
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                        <form action={deleteFile.bind(null, file.id, project.id)}>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                            {project.files.filter(f => f.is_generated).length === 0 && (
                                <p className="text-[10px] text-center text-muted-foreground py-2">No items yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Workspace */}
                <div className="lg:col-span-3 space-y-6">

                    <Card>
                        <CardHeader>
                            <CardTitle>Analysis Logic</CardTitle>
                            <CardDescription>Select what to generate.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AnalysisForm projectId={project.id} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    )
}
