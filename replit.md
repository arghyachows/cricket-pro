# Overview

From the Pavilion is a comprehensive cricket management game built with Next.js and MongoDB. The application simulates realistic T20 cricket matches with detailed player statistics, team management, marketplace trading, and league competition systems. Users can create and manage their own cricket clubs, recruit players, participate in matches, and compete in league tables while experiencing authentic cricket simulation with ball-by-ball commentary.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 14 with App Router for modern React-based server-side rendering
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **State Management**: React hooks and local state for client-side data management
- **UI Components**: Comprehensive shadcn/ui toolkit including cards, dialogs, tables, and form elements
- **Real-time Updates**: Client-side polling for match simulation and live commentary

## Backend Architecture
- **API Structure**: Next.js API routes using catch-all dynamic routing (`[[...path]]/route.js`)
- **Authentication**: Session-based authentication with user registration and login
- **Match Simulation Engine**: Complex cricket simulation with realistic ball-by-ball commentary, player statistics, and match outcomes
- **Player Generation**: Algorithmic player creation with skill-based ratings and market values
- **League System**: Tournament management with standings, match scheduling, and results tracking

## Data Storage Solutions
- **Database**: MongoDB with native driver integration
- **Collections**: Users, players, matches, lineups, marketplace listings, and league data
- **Schema Design**: Document-based structure optimized for cricket statistics and match data
- **Connection Management**: Singleton pattern for database connections with environment-based configuration

## Authentication and Authorization
- **User Registration**: Email-based account creation with team management setup
- **Session Management**: Server-side session handling for authenticated routes
- **User Context**: Client-side user state management across application components

## Match Simulation System
- **T20 Format**: 20-over cricket simulation with realistic ball outcomes
- **Commentary Generation**: Dynamic ball-by-ball commentary with contextual events
- **Player Performance**: Skill-based probability calculations for batting, bowling, and fielding
- **State Management**: Real-time match progression with pause/resume functionality
- **Result Processing**: Automatic league table updates and player statistics tracking

# External Dependencies

## Third-party Libraries
- **UI Framework**: shadcn/ui component system built on Radix UI primitives
- **Styling**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Zod validation resolvers
- **Data Tables**: TanStack React Table for complex data presentation
- **HTTP Client**: Axios for API communication
- **Date Handling**: date-fns for date manipulation and formatting

## Database Integration
- **MongoDB Driver**: Native MongoDB client for Node.js
- **Connection String**: Environment-based MongoDB Atlas or local instance configuration

## Development Tools
- **Build System**: Next.js with optimized webpack configuration
- **PostCSS**: Autoprefixer and Tailwind CSS processing
- **Testing**: Python-based backend testing suite for API validation
- **Development Server**: Configured for Replit hosting with CORS and frame options

## Deployment Configuration
- **Output**: Standalone Next.js build for container deployment
- **Asset Optimization**: Unoptimized images for compatibility
- **Server Configuration**: Custom hostname and port binding for Replit environment
- **Memory Management**: Node.js memory limits configured for resource-constrained environments