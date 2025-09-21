import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import { MDXRemote } from 'next-mdx-remote/rsc'
import MDXComponents from '@/components/mdx-components'

export async function generateStaticParams() {
  const posts = fs.readdirSync(path.join(process.cwd(), 'src/content'))
  return posts.map((post) => ({
    slug: post.replace(/\.mdx$/, ''),
  }))
}

export default async function Post({ params }: { params: { slug: string } }) {
  const { slug } = params
  const postPath = path.join(process.cwd(), 'src/content', `${slug}.mdx`)
  
  try {
    const source = fs.readFileSync(postPath, 'utf8')
    
    return (
      <article className="max-w-4xl mx-auto p-8">
        <MDXRemote 
          source={source} 
          components={MDXComponents}
        />
      </article>
    )
  } catch (error) {
    notFound()
  }
}