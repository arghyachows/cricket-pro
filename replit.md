# Overview

From the Pavilion is a comprehensive T20 cricket management game built with Next.js and MongoDB. The application allows users to create and manage their own cricket clubs, handle player rosters, simulate matches, participate in leagues, and engage with a marketplace for player trading. The game features realistic cricket simulation with detailed player statistics, match commentary, and progressive league systems.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 14 with React Server Components and App Router
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **State Management**: React hooks (useState, useEffect) for client-side state
- **Forms**: React Hook Form with resolvers for form validation
- **Icons**: Lucide React for consistent iconography
- **Responsive Design**: Mobile-first approach with Tailwind's responsive utilities

## Backend Architecture
- **API Routes**: Next.js API routes with catch-all routing pattern (`[[...path]]/route.js`)
- **Database Integration**: Direct MongoDB connection using official MongoDB driver
- **Authentication**: Custom authentication system with email/password
- **Match Simulation**: Complex cricket match simulation engine with realistic player statistics
- **Data Generation**: Automated player generation with skill-based attributes

## Data Storage Solutions
- **Primary Database**: MongoDB for all application data
- **Collections**: Users, players, matches, leagues, marketplace listings
- **Connection Pattern**: Singleton MongoDB client with connection reuse
- **Data Models**: Document-based storage with embedded player statistics and match data

## Key Game Features
- **Player Management**: Comprehensive player statistics including batting, bowling, keeping, technique, fielding, endurance, power, and captaincy skills
- **Match Simulation**: Real-time T20 cricket match simulation with ball-by-ball commentary
- **League System**: Structured league competitions with standings and statistics
- **Marketplace**: Player trading system for team building
- **Team Management**: Squad selection, lineup management, and strategic decisions

## Performance Optimizations
- **Memory Management**: Reduced Node.js memory allocation for development environment
- **Image Optimization**: Disabled for deployment flexibility
- **Webpack Configuration**: Custom polling and aggregation for file watching
- **Caching**: On-demand entries configuration for better performance

# External Dependencies

## Core Framework Dependencies
- **Next.js 14**: React framework with App Router and Server Components
- **React**: UI library for component-based architecture
- **MongoDB**: Primary database for all application data storage

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Headless UI components for accessibility and functionality
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography

## Development and Utilities
- **Axios**: HTTP client for API requests
- **date-fns**: Date manipulation and formatting
- **class-variance-authority**: Utility for managing component variants
- **clsx**: Conditional className utility
- **uuid**: Unique identifier generation

## Testing Infrastructure
- **Python Test Scripts**: Custom testing suite for backend API validation
- **Request Library**: HTTP testing for API endpoints
- **Match Simulation Testing**: Specialized tests for cricket match simulation logic

Note: The application is designed to be database-agnostic at the MongoDB driver level, allowing for potential future database migrations while maintaining the current document-based data structure.