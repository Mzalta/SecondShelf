/**
 * Shared seeding logic for textbook listings
 * Can be used by both CLI script and API route
 */

import { createClient } from '@supabase/supabase-js'

// Textbook base data (30-40 popular textbooks)
export interface TextbookBase {
  title: string
  author: string
  edition: string
  course: string
  category: string
  isbnPrefix: string
}

export const textbookBases: TextbookBase[] = [
  { title: 'Campbell Biology', author: 'Lisa Urry, Michael Cain, Steven Wasserman, Peter Minorsky', edition: '12th Edition', course: 'BIOL 101', category: 'STEM - Biology', isbnPrefix: '9780135188743' },
  { title: 'Calculus: Early Transcendentals', author: 'James Stewart', edition: '9th Edition', course: 'MATH 150', category: 'STEM - Mathematics', isbnPrefix: '9781337613927' },
  { title: 'Organic Chemistry', author: 'John McMurry', edition: '9th Edition', course: 'CHEM 231', category: 'STEM - Chemistry', isbnPrefix: '9781305080485' },
  { title: 'Principles of Economics', author: 'Gregory Mankiw', edition: '9th Edition', course: 'ECON 101', category: 'Business - Economics', isbnPrefix: '9780357133516' },
  { title: 'Psychology', author: 'David Myers, Nathan DeWall', edition: '13th Edition', course: 'PSYC 101', category: 'Social Sciences - Psychology', isbnPrefix: '9781319132101' },
  { title: 'Human Anatomy & Physiology', author: 'Elaine Marieb, Katja Hoehn', edition: '11th Edition', course: 'BIOL 240', category: 'STEM - Biology', isbnPrefix: '9780134756363' },
  { title: 'Microbiology: An Introduction', author: 'Gerard Tortora, Berdell Funke, Christine Case', edition: '13th Edition', course: 'BIOL 210', category: 'STEM - Biology', isbnPrefix: '9780134605180' },
  { title: 'Chemistry: The Central Science', author: 'Theodore Brown, H. Eugene LeMay, Bruce Bursten', edition: '15th Edition', course: 'CHEM 101', category: 'STEM - Chemistry', isbnPrefix: '9780137493609' },
  { title: 'Physics for Scientists and Engineers', author: 'Raymond Serway, John Jewett', edition: '10th Edition', course: 'PHYS 201', category: 'STEM - Physics', isbnPrefix: '9781337553445' },
  { title: 'Introduction to Psychology', author: 'James Kalat', edition: '13th Edition', course: 'PSYC 100', category: 'Social Sciences - Psychology', isbnPrefix: '9780357373968' },
  { title: 'Statistics: Informed Decisions Using Data', author: 'Michael Sullivan', edition: '6th Edition', course: 'STAT 200', category: 'STEM - Mathematics', isbnPrefix: '9780134133539' },
  { title: 'Fundamentals of Nursing', author: 'Patricia Potter, Anne Perry, Patricia Stockert, Amy Hall', edition: '10th Edition', course: 'NURS 101', category: 'Health Sciences - Nursing', isbnPrefix: '9780323677721' },
  { title: 'Essentials of Marketing', author: 'Charles Lamb, Joseph Hair, Carl McDaniel', edition: '16th Edition', course: 'MKTG 301', category: 'Business - Marketing', isbnPrefix: '9781337091995' },
  { title: 'Fundamentals of Financial Management', author: 'Eugene Brigham, Joel Houston', edition: '16th Edition', course: 'FIN 301', category: 'Business - Finance', isbnPrefix: '9781337395250' },
  { title: 'American Government: Institutions and Policies', author: 'James Wilson, John DiIulio, Meena Bose', edition: '17th Edition', course: 'POLI 101', category: 'Social Sciences - Political Science', isbnPrefix: '9781337568395' },
  { title: 'The Norton Anthology of American Literature', author: 'Robert Levine, Michael Elliott, Sandra Gustafson', edition: '9th Edition', course: 'ENGL 201', category: 'Humanities - Literature', isbnPrefix: '9780393264531' },
  { title: 'World Civilizations: The Global Experience', author: 'Peter Stearns, Michael Adas, Stuart Schwartz, Marc Gilbert', edition: '8th Edition', course: 'HIST 101', category: 'Humanities - History', isbnPrefix: '9780134228150' },
  { title: 'Database System Concepts', author: 'Abraham Silberschatz, Henry Korth, S. Sudarshan', edition: '7th Edition', course: 'CS 440', category: 'STEM - Computer Science', isbnPrefix: '9780078022159' },
  { title: 'Introduction to Algorithms', author: 'Thomas Cormen, Charles Leiserson, Ronald Rivest, Clifford Stein', edition: '4th Edition', course: 'CS 381', category: 'STEM - Computer Science', isbnPrefix: '9780262046305' },
  { title: 'Operating System Concepts', author: 'Abraham Silberschatz, Peter Galvin, Greg Gagne', edition: '10th Edition', course: 'CS 350', category: 'STEM - Computer Science', isbnPrefix: '9781118063330' },
  { title: 'Linear Algebra and Its Applications', author: 'David Lay, Steven Lay, Judi McDonald', edition: '6th Edition', course: 'MATH 310', category: 'STEM - Mathematics', isbnPrefix: '9780135851258' },
  { title: 'Mechanical Engineering Design', author: 'Richard Budynas, Keith Nisbett', edition: '11th Edition', course: 'ME 301', category: 'STEM - Engineering', isbnPrefix: '9780133915426' },
  { title: 'Electronic Devices and Circuit Theory', author: 'Robert Boylestad, Louis Nashelsky', edition: '11th Edition', course: 'EE 301', category: 'STEM - Engineering', isbnPrefix: '9780132622264' },
  { title: 'Contemporary Abstract Algebra', author: 'Joseph Gallian', edition: '10th Edition', course: 'MATH 350', category: 'STEM - Mathematics', isbnPrefix: '9780357670986' },
  { title: 'Financial Accounting', author: 'Jerry Weygandt, Paul Kimmel, Donald Kieso', edition: '11th Edition', course: 'ACCT 201', category: 'Business - Accounting', isbnPrefix: '9781119577651' },
  { title: 'Principles of Managerial Finance', author: 'Lawrence Gitman, Chad Zutter', edition: '15th Edition', course: 'FIN 310', category: 'Business - Finance', isbnPrefix: '9780134476315' },
  { title: 'Strategic Management', author: 'Frank Rothaermel', edition: '5th Edition', course: 'MGMT 400', category: 'Business - Management', isbnPrefix: '9781260084668' },
  { title: 'Communication: Principles for a Lifetime', author: 'Steven Beebe, Susan Beebe, Diana Ivy', edition: '7th Edition', course: 'COMM 101', category: 'Social Sciences - Communication', isbnPrefix: '9780134890174' },
  { title: 'Introduction to Sociology', author: 'Anthony Giddens, Mitchell Duneier, Richard Appelbaum', edition: '11th Edition', course: 'SOC 101', category: 'Social Sciences - Sociology', isbnPrefix: '9780393667615' },
  { title: 'Fundamentals of Corporate Finance', author: 'Stephen Ross, Randolph Westerfield, Bradford Jordan', edition: '13th Edition', course: 'FIN 300', category: 'Business - Finance', isbnPrefix: '9781260772395' },
  { title: 'Medical-Surgical Nursing', author: 'Donna Ignatavicius, M. Linda Workman, Cherie Rebar', edition: '10th Edition', course: 'NURS 300', category: 'Health Sciences - Nursing', isbnPrefix: '9780323677790' },
  { title: 'Fundamentals of General, Organic, and Biological Chemistry', author: 'John McMurry, David Ballantine, Carl Hoeger', edition: '8th Edition', course: 'CHEM 110', category: 'STEM - Chemistry', isbnPrefix: '9780134015187' },
  { title: 'Differential Equations and Linear Algebra', author: 'Stephen Goode, Scott Annin', edition: '4th Edition', course: 'MATH 320', category: 'STEM - Mathematics', isbnPrefix: '9780321964670' },
  { title: 'Computer Networks', author: 'Andrew Tanenbaum, Nick Feamster, David Wetherall', edition: '6th Edition', course: 'CS 425', category: 'STEM - Computer Science', isbnPrefix: '9780135408001' },
  { title: 'Criminal Justice: A Brief Introduction', author: 'Frank Schmalleger', edition: '13th Edition', course: 'CJUS 101', category: 'Social Sciences - Criminal Justice', isbnPrefix: '9780135186268' },
]

// Condition types and their price multipliers
export const conditions = [
  { name: 'New', multiplier: 0.9, minPrice: 100, maxPrice: 200, descriptions: ['Brand new, never used', 'Still in shrink wrap', 'Unopened access code included'] },
  { name: 'Like New', multiplier: 0.75, minPrice: 80, maxPrice: 150, descriptions: ['Looks brand new', 'No marks or highlighting', 'Minimal wear', 'Pages are pristine'] },
  { name: 'Very Good', multiplier: 0.6, minPrice: 50, maxPrice: 120, descriptions: ['Light highlighting in first few chapters', 'Minor cover wear', 'No writing or marks', 'Clean pages'] },
  { name: 'Good', multiplier: 0.45, minPrice: 30, maxPrice: 80, descriptions: ['Some highlighting throughout', 'Cover wear but pages intact', 'Used but in good condition', 'Notes in margins'] },
  { name: 'Acceptable', multiplier: 0.3, minPrice: 20, maxPrice: 50, descriptions: ['Significant wear but usable', 'Highlighting and notes', 'Cover may be damaged', 'All pages present'] },
]

// Helper function to generate random number in range
export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to randomly select from array
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper function to generate fake email
export function generateEmail(name: string): string {
  const domains = ['student.edu', 'university.edu', 'college.edu']
  const cleanName = name.toLowerCase().replace(/\s+/g, '.')
  return `${cleanName}@${randomChoice(domains)}`
}

// Helper function to generate fake phone
export function generatePhone(): string {
  return `(${random(200, 999)}) ${random(200, 999)}-${random(1000, 9999)}`
}

// Helper function to generate ISBN variation
export function generateISBN(baseISBN: string): string {
  const prefix = baseISBN.slice(0, -4)
  const suffix = random(1000, 9999).toString()
  return prefix + suffix
}

// Helper function to generate tags
export function generateTags(hasSolutions: boolean, hasAccessCode: boolean, condition: string): string[] {
  const tags: string[] = []
  
  if (hasSolutions) tags.push('solutions manual')
  if (hasAccessCode) tags.push('access code')
  if (condition === 'New' || condition === 'Like New') tags.push('like new')
  if (Math.random() > 0.7) tags.push('hardcover')
  if (Math.random() > 0.8) tags.push('international edition')
  if (Math.random() > 0.8) tags.push('rental return')
  if (Math.random() > 0.9) tags.push('early edition')
  
  return tags
}

// Helper function to generate description
export function generateDescription(
  textbook: TextbookBase,
  condition: typeof conditions[0],
  conditionDesc: string,
  hasSolutions: boolean,
  hasAccessCode: boolean
): string {
  let desc = `Selling ${textbook.title} (${textbook.edition}) by ${textbook.author.split(',')[0]}. ${conditionDesc}. `
  
  if (hasSolutions) {
    desc += 'Includes solutions manual. '
  }
  
  if (hasAccessCode) {
    desc += 'Unused access code included. '
  }
  
  desc += `Perfect for ${textbook.course}. Great condition for the price!`
  
  return desc
}

// Helper function to generate condition text
export function generateConditionText(condition: typeof conditions[0]): string {
  return randomChoice(condition.descriptions)
}

// Generate fake seller names
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Cameron', 'Dakota', 'Jamie', 'Blake', 'Sage', 'Rowan', 'Emery']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas']

export function generateSellerName(): string {
  return `${randomChoice(firstNames)} ${randomChoice(lastNames)}`
}

/**
 * Main seeding function
 * Returns a result object with success status and details
 */
export async function seedListings(
  supabaseUrl: string,
  supabaseServiceKey: string,
  options: { skipIfExists?: boolean; existingThreshold?: number } = {}
): Promise<{
  success: boolean
  skipped?: boolean
  inserted?: number
  generated?: number
  error?: string
  message?: string
}> {
  const { skipIfExists = true, existingThreshold = 50 } = options

  // Create Supabase admin client (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Idempotency check: skip if more than threshold listings exist
    if (skipIfExists) {
      const { count, error: countError } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw new Error(`Failed to count existing listings: ${countError.message}`)
      }

      if (count && count > existingThreshold) {
        return {
          success: true,
          skipped: true,
          message: `Skipped: ${count} listings already exist (threshold: ${existingThreshold})`
        }
      }
    }

    // Get existing users from profiles table for seller_id
    let sellerIds: string[] = []
    
    try {
      const { data: profileUsers, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(25)

      if (!profileError && profileUsers && profileUsers.length > 0) {
        sellerIds = profileUsers.map(u => u.id)
      }
    } catch (error: any) {
      throw new Error(`Could not fetch existing users: ${error.message}`)
    }

    if (sellerIds.length === 0) {
      throw new Error('No users found in profiles table. Create at least one user before seeding listings.')
    }

    // Generate listings
    const listings: any[] = []

    for (const textbook of textbookBases) {
      const numVariations = random(4, 8)
      
      for (let i = 0; i < numVariations; i++) {
        const condition = randomChoice(conditions)
        const conditionText = generateConditionText(condition)
        const hasSolutions = Math.random() < 0.3
        const hasAccessCode = Math.random() < 0.2
        const price = random(condition.minPrice, condition.maxPrice)
        
        let finalPrice = Math.round(price * condition.multiplier)
        if (hasAccessCode && condition.name === 'New') {
          finalPrice += random(20, 40)
        }
        
        const tags = generateTags(hasSolutions, hasAccessCode, condition.name)
        const description = generateDescription(textbook, condition, conditionText, hasSolutions, hasAccessCode)
        const sellerId = randomChoice(sellerIds)
        const poster = generateSellerName()
        const contact = Math.random() > 0.5 ? generateEmail(poster) : generatePhone()
        
        const numImages = random(1, 3)
        const images: string[] = []
        for (let j = 0; j < numImages; j++) {
          const seed = `${textbook.title}-${i}-${j}`.replace(/\s+/g, '-').toLowerCase()
          images.push(`https://picsum.photos/seed/${seed}/800/600`)
        }
        
        listings.push({
          user_id: sellerId,
          title: textbook.title,
          author: textbook.author,
          course: textbook.course,
          price: `$${finalPrice}`,
          contact: contact,
          poster: poster,
          sold: false,
          category: textbook.category,
          image_url: images[0],
          isbn: generateISBN(textbook.isbnPrefix),
          edition: textbook.edition,
          condition_text: conditionText,
          description: description,
          tags: tags.length > 0 ? tags : null,
        })
      }
    }

    // Insert in batches to avoid timeouts
    const batchSize = 25
    let inserted = 0

    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('books')
        .insert(batch)

      if (insertError) {
        throw new Error(`Error inserting batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`)
      }

      inserted += batch.length
    }

    return {
      success: true,
      inserted,
      generated: listings.length,
      message: `Successfully inserted ${inserted} listings`
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error)
    }
  }
}

