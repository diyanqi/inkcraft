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
import { Button } from "@/components/ui/button"
import { Star } from 'lucide-react'
import { IconStarFilled } from '@tabler/icons-react'
import TiltedCard from '@/components/animation/tilted-card'

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
      <h1 className="text-2xl font-bold tracking-tight">素材广场</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentMaterials.map((material) => (
          <TiltedCard
            key={material.id}
            imageSrc={material.image}
            altText={material.description}
            captionText={material.description}
            // containerHeight="100%"
            // containerWidth="100%"
            // imageHeight="300px"
            // imageWidth="300px"
            rotateAmplitude={6}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={true}
            displayOverlayContent={true}
            overlayContent={
              <Card key={material.id} className="group overflow-hidden transition-all hover:shadow-lg w-[135%]">
                <CardHeader>
                  <CardTitle className="mb-2 truncate">{material.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {material.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">

                  <div className='mt-2'>
                    {material.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={material.starred ? 'default' : 'secondary'}
                    onClick={() => handleStarClick(material.id)}
                  >
                    {material.starred ? <IconStarFilled /> : <Star />}
                    {material.starred ? '已收藏' : '收藏'}
                  </Button>
                </CardFooter>
              </Card>
            }
          />
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
