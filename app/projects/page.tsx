import { getProjects, deleteProject } from "@/lib/actions"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Trash } from "lucide-react"
import Link from "next/link"

export default async function ProjectsPage() {
    const projects = await getProjects()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">
                        Manage your user research projects and context.
                    </p>
                </div>
                <CreateProjectDialog />
            </div>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground h-64">
                    <p>No projects yet. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Card key={project.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle>{project.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {project.description || "No description"}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-sm text-muted-foreground">
                                    Updated: {new Date(project.updated_at).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {project.file_count ?? 0} files
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button variant="outline" className="flex-1" asChild>
                                    <Link href={`/projects/${project.id}`}>Open</Link>
                                </Button>
                                <form action={deleteProject.bind(null, project.id)}>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
                                        <Trash className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
