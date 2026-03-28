import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // RentFlow Brand Colors
        'rentflow': {
          'navy': '#141A46',        // Primary - Rent
          'gold': '#EEAA23',         // Accent - low & Top of F
          'teal': '#00203F',         // Accent - Bottom of F
          'blue': '#007bff',         // Interactive elements (buttons, links)
        },
        // Semantic colors using brand palette
        'primary': '#141A46',        // Navy Blue
        'secondary': '#00203F',      // Deep Teal
        'accent': '#EEAA23',         // Gold
        'rentflow-blue': '#007bff',  // Button and interactive blue
      },
      backgroundImage: {
        'gradient-rentflow': 'linear-gradient(135deg, #141A46 0%, #00203F 100%)',
        'gradient-warm': 'linear-gradient(135deg, #EEAA23 0%, #141A46 100%)',
      },
    },
  },
  plugins: [],
}

export default config
