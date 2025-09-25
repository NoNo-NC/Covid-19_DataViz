import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function validateBuild() {
  console.log('🔍 Validating build output...\n')
  
  const distPath = join(__dirname, '..', 'dist')
  
  try {
    // Vérifier que le dossier dist existe
    await fs.access(distPath)
    console.log('✅ Build directory exists')
    
    // Vérifier les fichiers essentiels
    const requiredFiles = ['index.html', 'assets']
    
    for (const file of requiredFiles) {
      const filePath = join(distPath, file)
      try {
        await fs.access(filePath)
        console.log(`✅ ${file} found`)
      } catch {
        throw new Error(`Missing required file: ${file}`)
      }
    }
    
    // Vérifier que index.html n'est pas vide
    const indexContent = await fs.readFile(join(distPath, 'index.html'), 'utf-8')
    if (indexContent.length < 100) {
      throw new Error('index.html seems to be empty or corrupted')
    }
    console.log('✅ index.html has content')
    
    // Vérifier les assets
    const assetsPath = join(distPath, 'assets')
    const assets = await fs.readdir(assetsPath)
    
    const hasJS = assets.some(file => file.endsWith('.js'))
    const hasCSS = assets.some(file => file.endsWith('.css'))
    
    if (!hasJS) throw new Error('No JavaScript files found in assets')
    if (!hasCSS) throw new Error('No CSS files found in assets')
    
    console.log('✅ JavaScript and CSS assets found')
    
    console.log('\n🎉 Build validation completed successfully!')
    
  } catch (error) {
    console.log(`\n❌ Build validation failed: ${error.message}`)
    process.exit(1)
  }
}

validateBuild()