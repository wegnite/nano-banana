/**
 * Character Figure Templates API Route
 * 
 * Problem: Need API endpoints for managing character generation templates
 * Solution: Create endpoints for browsing templates and generating from templates
 * 
 * Endpoints:
 * - GET /api/character-figure/templates - Browse available templates
 * - POST /api/character-figure/templates/[templateId]/generate - Generate from template
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { respData, respErr } from '@/lib/resp';
import { getCharacterTemplates, generateWithTemplate } from '@/services/character-figure';
import { CharacterFigureRequest } from '../types';

/**
 * GET /api/character-figure/templates
 * Get available character templates
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication is optional for viewing templates
    const session = await auth();
    
    // Parse query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const featured = searchParams.get('featured') === 'true';
    const category = searchParams.get('category');

    console.log(`Templates request: featured=${featured}, category=${category}`);

    // Get templates
    const templates = await getCharacterTemplates(featured);

    // Filter by category if specified
    const filteredTemplates = category 
      ? templates.filter(t => t.category === category)
      : templates;

    // Group templates by category for better frontend organization
    const templatesByCategory = filteredTemplates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, any[]>);

    // Get unique categories
    const availableCategories = [...new Set(templates.map(t => t.category))];

    return respData({
      templates: filteredTemplates,
      templates_by_category: templatesByCategory,
      available_categories: availableCategories,
      total_templates: filteredTemplates.length,
      featured_templates: templates.filter(t => t.is_featured),
      filters: {
        featured,
        category,
        available_categories: availableCategories
      },
      user_authenticated: !!session?.user
    });

  } catch (error: any) {
    console.error('Templates API error:', error);
    return respErr('Failed to load character templates', 500);
  }
}