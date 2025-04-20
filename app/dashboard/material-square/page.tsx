'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const mockMaterials = [
  {
    id: 1,
    title: '高考英语写作素材：环境保护',
    description: '关于环境保护的常用表达和例子',
    image: 'https://source.unsplash.com/random/800x600?environment',
    tags: ['环境', '高考英语']
  },
  {
    id: 2,
    title: '科技发展话题素材',
    description: '科技发展对社会影响的论述要点',
    image: 'https://source.unsplash.com/random/800x600?technology',
    tags: ['科技', '社会发展']
  },
  {
    id: 3,
    title: '传统文化与现代生活',
    description: '中国传统文化在现代生活中的传承与创新',
    image: 'https://source.unsplash.com/random/800x600?culture',
    tags: ['文化', '传统']
  },
  {
    id: 4,
    title: '教育改革与发展',
    description: '关于教育改革的深度思考与分析',
    image: 'https://source.unsplash.com/random/800x600?education',
    tags: ['教育', '改革']
  },
  {
    id: 5,
    title: '城市化进程素材',
    description: '城市化带来的机遇与挑战',
    image: 'https://source.unsplash.com/random/800x600?city',
    tags: ['城市化', '发展']
  },
  {
    id: 6,
    title: '健康生活方式',
    description: '现代人如何保持健康的生活方式',
    image: 'https://source.unsplash.com/random/800x600?health',
    tags: ['健康', '生活']
  }
];

export default function MaterialSquarePage() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const totalPages = Math.ceil(mockMaterials.length / itemsPerPage)
  
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMaterials = mockMaterials.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold tracking-tight">素材广场</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentMaterials.map((material) => (
          <Card key={material.id} className="group overflow-hidden transition-all hover:shadow-lg">
            <CardHeader className="p-0">
              <div className="aspect-square overflow-hidden rounded-t-xl">
                <img
                  src={material.image}
                  alt={material.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="mb-2 truncate">{material.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {material.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex-wrap gap-1 p-4 pt-0">
              {material.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </CardFooter>
          </Card>
        ))}
      </div>
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) setCurrentPage(currentPage - 1)
              }}
            />
          </PaginationItem>
          {currentPage > 2 && (
            <PaginationItem>
              <PaginationLink 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(1)
                }}
              >
                1
              </PaginationLink>
            </PaginationItem>
          )}
          {currentPage > 3 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationLink 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(currentPage - 1)
                }}
              >
                {currentPage - 1}
              </PaginationLink>
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationLink href="#" isActive>
              {currentPage}
            </PaginationLink>
          </PaginationItem>
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationLink 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(currentPage + 1)
                }}
              >
                {currentPage + 1}
              </PaginationLink>
            </PaginationItem>
          )}
          {currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {currentPage < totalPages - 1 && (
            <PaginationItem>
              <PaginationLink 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(totalPages)
                }}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) setCurrentPage(currentPage + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}