# sierra-transfer-count

A counter application with campaign tracking, built with Netlify Functions and Supabase.

## Setup

### Environment Variables

This application requires Supabase for data storage. You need to set up the following environment variables:

1. **For local development**, create a `.env` file in the root directory:
   ```
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. **For production on Netlify**:
   - Go to your Netlify dashboard
   - Navigate to Site settings → Environment variables
   - Add the following variables:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Getting Supabase Credentials

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the "Project URL" (this is your `SUPABASE_URL`)
5. Copy the "anon public" key (this is your `SUPABASE_ANON_KEY`)

### Database Setup

Create the following tables in your Supabase project:

1. **totals** table:
   ```sql
   CREATE TABLE totals (
     id INT PRIMARY KEY DEFAULT 1,
     total_count INT DEFAULT 0,
     last_increment TIMESTAMP,
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   INSERT INTO totals (id, total_count) VALUES (1, 0);
   ```

2. **campaigns** table:
   ```sql
   CREATE TABLE campaigns (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) UNIQUE NOT NULL,
     count INT DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

## Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Set the environment variables in Netlify (as described above)
4. Deploy!

## Usage

- **Main counter**: Visit your site URL
- **Dashboard**: Visit `/netlify/functions/dashboard`
- **Reset campaigns**: Use the dashboard interface to reset individual campaigns or all data