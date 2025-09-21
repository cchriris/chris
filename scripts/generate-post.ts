import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';

const git = simpleGit();

// 配置 OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateBlogPost(topic: string) {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Write a blog post about ${topic}. Include a title, date, and content in MDX format. Use markdown formatting.`
      }],
    });

    const content = completion.data.choices[0].message?.content;
    if (!content) throw new Error('No content generated');
    
    return content;
  } catch (error) {
    console.error('Error generating blog post:', error);
    throw error;
  }
}

async function saveBlogPost(content: string) {
  const date = new Date().toISOString().split('T')[0];
  const slug = content
    .split('\n')[0]
    .replace(/^#\s+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const filePath = path.join(process.cwd(), 'src/content', `${slug}.mdx`);
  fs.writeFileSync(filePath, content);

  return { slug, filePath };
}

async function commitAndPush(filePath: string, message: string) {
  await git.add(filePath);
  await git.commit(message);
  await git.push('origin', 'main');
}

async function main() {
  const topic = process.argv[2];
  if (!topic) {
    console.error('Please provide a topic for the blog post');
    process.exit(1);
  }

  try {
    console.log(`Generating blog post about: ${topic}`);
    const content = await generateBlogPost(topic);
    
    console.log('Saving blog post...');
    const { filePath } = await saveBlogPost(content);
    
    console.log('Committing and pushing changes...');
    await commitAndPush(filePath, `Add new blog post: ${topic}`);
    
    console.log('Done! The blog post has been created and published.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();