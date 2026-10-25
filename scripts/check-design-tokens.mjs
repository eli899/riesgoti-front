// Guardián del sistema de diseño (roadmap v0.7, RQ-11). Se ejecuta con `pnpm lint` y falla si en src/ reaparecen:
//   - tamaños de texto o radios en píxeles (`text-[13px]`, `rounded-t-[22px]`): usar la escala de index.css;
//   - colores hexadecimales en clases (`bg-[#2563eb]`, `shadow-[0_0_0_4px_#BFDBFE]`): usar los tokens de color.
// Uso: node scripts/check-design-tokens.mjs [directorio]   (por defecto, src)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.resolve(root, process.argv[2] ?? 'src')

const RULES = [
  { re: /(?<=^|[\s"'`:])text-\[\d+(?:\.\d+)?px\]/g, hint: 'usa la escala text-2xs … text-3xl' },
  { re: /(?<=^|[\s"'`:])rounded(?:-[trblxyse]{1,2})?-\[\d+(?:\.\d+)?px\]/g, hint: 'usa rounded-bar | inset | control | tile | card | card-mobile | sheet' },
  { re: /(?<=^|[\s"'`:])[a-z-]+-\[[^\]\s]*#[0-9a-fA-F]{3,8}[^\]\s]*\]/g, hint: 'usa un token de color del tema (index.css)' },
]

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) yield* sourceFiles(full)
    else if (/\.(tsx?|jsx?)$/.test(entry)) yield full
  }
}

const problems = []
for (const file of sourceFiles(target)) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const { re, hint } of RULES) {
      for (const match of line.matchAll(re)) {
        problems.push(`${path.relative(root, file)}:${i + 1}  ${match[0]}  → ${hint}`)
      }
    }
  })
}

if (problems.length) {
  console.error(`✖ Sistema de diseño: ${problems.length} valor(es) fuera de los tokens (front/README.md, «Sistema de diseño»):\n`)
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('✔ Sistema de diseño: sin valores arbitrarios de texto, radio ni color.')
