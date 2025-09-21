import { MDXComponents } from 'mdx/types'
import Image from 'next/image'

const components: MDXComponents = {
  // 自定义 MDX 组件配置
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
  ),
  p: ({ children }) => (
    <p className="my-4 leading-relaxed">{children}</p>
  ),
  img: (props) => (
    <Image
      {...props}
      alt={props.alt || ''}
      className="rounded-lg my-8"
      width={800}
      height={400}
    />
  ),
  pre: ({ children }) => (
    <pre className="bg-gray-800 text-white p-4 rounded-lg my-4 overflow-x-auto">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="bg-gray-100 px-1 rounded">{children}</code>
  ),
}

export default components