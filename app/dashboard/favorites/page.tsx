'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

let mockMaterials = [
    {
        id: 1,
        title: '高考英语写作素材：环境保护',
        description: '关于环境保护的常用表达和例子',
        image: 'https://t.alcy.cc/fj',
        tags: ['环境', '高考英语'],
        starred: true,
    },
    {
        id: 2,
        title: '科技发展话题素材',
        description: '科技发展对社会影响的论述要点',
        image: 'https://t.alcy.cc/fj',
        tags: ['科技', '社会发展'],
        starred: false,
    },
    {
        id: 3,
        title: '传统文化与现代生活',
        description: '中国传统文化在现代生活中的传承与创新',
        image: 'https://t.alcy.cc/fj?culture',
        tags: ['文化', '传统'],
        starred: false,
    },
    {
        id: 4,
        title: '教育改革与发展',
        description: '关于教育改革的深度思考与分析',
        image: 'https://t.alcy.cc/fj?education',
        tags: ['教育', '改革'],
        starred: false,
    },
    {
        id: 5,
        title: '城市化进程素材',
        description: '城市化带来的机遇与挑战',
        image: 'https://t.alcy.cc/fj?city',
        tags: ['城市化', '发展'],
        starred: false,
    },
    {
        id: 6,
        title: '健康生活方式',
        description: '现代人如何保持健康的生活方式',
        image: 'https://t.alcy.cc/fj?health',
        tags: ['健康', '生活'],
        starred: false,
    }
];

export default function MaterialSquarePage() {
    const [materials, setMaterials] = useState(mockMaterials);
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8
    const totalPages = Math.ceil(materials.length / itemsPerPage)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentMaterials = materials.slice(startIndex, endIndex)

    const handleStarClick = (id: number) => {
        setMaterials(prevMaterials =>
            prevMaterials.map(material =>
                material.id === id
                    ? { ...material, starred: !material.starred }
                    : material
            )
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">星选集</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>标题</TableHead>
                            <TableHead>简介</TableHead>
                            <TableHead>标签</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {materials.map((material) => (
                            <TableRow key={material.id}>
                                <TableCell className="font-medium">{material.title}</TableCell>
                                <TableCell>{material.description}</TableCell>
                                <TableCell>{material.tags}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
