# Supabase Backup Restoration Instructions

## Your Backup File
- **File**: `db_cluster-19-08-2025@05-04-38.backup`
- **Format**: PostgreSQL SQL dump (full cluster backup)
- **Size**: 1.7MB, 6127 lines
- **Contains**: System tables (auth, realtime) + Your data (games, players tables)

## Important Notes
⚠️ **DO NOT restore the entire backup** - it contains system tables that will conflict with your new Supabase project.

You should only restore:
- `public.games` table structure and data
- `public.players` table structure and data

## Option 1: Use Supabase SQL Editor (Schema Only - No Data)

Since your backup uses PostgreSQL COPY format (which requires pg_restore), the SQL Editor can only recreate the tables, not the data.

### Steps:
1. **Create a new Supabase project** at https://supabase.com/dashboard
2. Go to **SQL Editor** in your new project
3. Run the `supabase_schema.sql` file I created to create the tables
4. (Data restoration requires pg_restore - see Option 2)

## Option 2: Install PostgreSQL Tools (Recommended for Full Restore)

To restore the data, you need PostgreSQL tools:

### On macOS:
```bash
# Install PostgreSQL (includes pg_restore)
brew install postgresql@15

# Or download from: https://www.postgresql.org/download/macosx/
```

### Then restore:
1. Create new Supabase project
2. Get connection string from Settings → Database → Connection string (use "Session" mode)
3. Run:
```bash
pg_restore -d "YOUR_CONNECTION_STRING" --clean --if-exists --no-owner --no-privileges db_cluster-19-08-2025@05-04-38.backup
```

## Option 3: Install Supabase CLI (Best Option)

```bash
# Install via npm (if you have Node.js)
npm install -g supabase

# Or via Homebrew (if you have it)
brew install supabase/tap/supabase
```

Then follow Supabase's restore documentation.

## Quick Start (Schema Only - Recommended First Step)

1. Create new Supabase project
2. Go to SQL Editor
3. Copy/paste contents of `supabase_schema.sql`
4. Run it
5. Your app will work (tables created, but no old data)


