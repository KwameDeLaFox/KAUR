'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileJson } from "lucide-react"
import ExcelJS from 'exceljs'

interface JourneyStage {
    name: string
    objectives: string[]
    needs: string[]
    feelings: string[]
    barriers: string[]
}

interface JourneyMapData {
    stages: JourneyStage[]
}

export function JourneyMapTable({ data }: { data: JourneyMapData }) {
    if (!data?.stages || data.stages.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No journey map data available.</div>
    }

    // Determine categories dynamically from the first stage object
    // Filter out 'name' or 'stage' keys
    const categories = Object.keys(data.stages[0]).filter(key => key.toLowerCase() !== 'name');

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('User Journey Map')

        // Define columns based on stages
        const columns = [
            { header: 'Category', key: 'category', width: 25 },
            ...data.stages.map((stage, idx) => ({
                header: stage.name || `Stage ${idx + 1}`,
                key: `stage_${idx}`,
                width: 35
            }))
        ]
        worksheet.columns = columns

        // Add rows for each category
        categories.forEach(cat => {
            const rowData: any = { category: cat.toUpperCase() }
            data.stages.forEach((stage, idx) => {
                const items = (stage as any)[cat] || []
                rowData[`stage_${idx}`] = Array.isArray(items) ? items.join('\n') : items
            })
            const row = worksheet.addRow(rowData)
            row.alignment = { vertical: 'top', wrapText: true }
        })

        // Style header
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        }

        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Journey_Map_${Date.now()}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const exportToCSV = () => {
        let csvContent = "Category," + data.stages.map(s => `"${(s.name || '').replace(/"/g, '""')}"`).join(",") + "\n"

        categories.forEach(cat => {
            let row = `"${cat.toUpperCase()}",`
            row += data.stages.map(stage => {
                const items = (stage as any)[cat] || []
                const content = Array.isArray(items) ? items.join('; ') : items
                return `"${String(content).replace(/"/g, '""')}"`
            }).join(",")
            csvContent += row + "\n"
        })

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `Journey_Map_${Date.now()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const getRowBg = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes('objective')) return 'bg-blue-50/50 dark:bg-blue-900/10';
        if (c.includes('need')) return 'bg-green-50/50 dark:bg-green-900/10';
        if (c.includes('feeling') || c.includes('emotion')) return 'bg-purple-50/50 dark:bg-purple-900/10';
        if (c.includes('barrier') || c.includes('pain')) return 'bg-red-50/50 dark:bg-red-900/10';
        if (c.includes('touchpoint')) return 'bg-amber-50/50 dark:bg-amber-900/10';
        return 'bg-muted/10';
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                </Button>
            </div>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px] bg-muted/50 font-bold">CATEGORY</TableHead>
                            {data.stages.map((stage, idx) => (
                                <TableHead key={idx} className="min-w-[220px] text-center bg-muted/30 font-bold border-l">
                                    {stage.name || `Stage ${idx + 1}`}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map(cat => (
                            <TableRow key={cat}>
                                <TableCell className={`font-semibold ${getRowBg(cat)}`}>
                                    {cat.toUpperCase()}
                                </TableCell>
                                {data.stages.map((stage, idx) => (
                                    <TableCell key={idx} className="border-l align-top">
                                        <ul className="list-disc list-inside text-xs space-y-1">
                                            {Array.isArray((stage as any)[cat]) ? (
                                                ((stage as any)[cat] as string[]).map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))
                                            ) : (
                                                <li>{(stage as any)[cat]}</li>
                                            )}
                                        </ul>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
