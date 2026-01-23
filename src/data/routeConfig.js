/**
 * Route configuration for lead sources
 * Maps URL slugs to CSV files
 */

// Auto-discover CSV files and create route mappings
const csvFiles = import.meta.glob('./*.csv', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// Generate routes from CSV filenames
// e.g., "tampa_hvac_cleaned.csv" -> { slug: "tampa_hvac", name: "Tampa HVAC", file: "tampa_hvac_cleaned.csv" }
const generateRoutes = () => {
  const routes = [];
  
  for (const path of Object.keys(csvFiles)) {
    const fileName = path.replace('./', '');
    // Skip non-cleaned files or other utility files
    if (!fileName.endsWith('_cleaned.csv')) continue;
    
    // Extract slug: "tampa_hvac_cleaned.csv" -> "tampa_hvac"
    const slug = fileName.replace('_cleaned.csv', '');
    
    // Generate display name: "tampa_hvac" -> "Tampa Hvac"
    const displayName = slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    routes.push({
      slug,
      name: displayName,
      file: fileName,
      content: csvFiles[path],
    });
  }
  
  return routes.sort((a, b) => a.name.localeCompare(b.name));
};

export const LEAD_ROUTES = generateRoutes();

/**
 * Get route config by slug
 */
export const getRouteBySlug = (slug) => {
  return LEAD_ROUTES.find(route => route.slug === slug);
};

/**
 * Get CSV content by slug
 */
export const getCsvBySlug = (slug) => {
  const route = getRouteBySlug(slug);
  if (!route) {
    const available = LEAD_ROUTES.map(r => r.slug).join(', ');
    throw new Error(`Route not found: ${slug}. Available: ${available || 'None'}`);
  }
  return {
    fileName: route.file,
    content: route.content,
    routeName: route.name,
  };
};

/**
 * List all available routes
 */
export const listRoutes = () => LEAD_ROUTES.map(r => ({ slug: r.slug, name: r.name }));
