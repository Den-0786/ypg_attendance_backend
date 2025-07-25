# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Backend Deployed**: Your Django backend should be deployed on Render (already done)

## Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### 2. Configure Project Settings

**Framework Preset**: Next.js (should be auto-detected)
**Root Directory**: `./` (leave as default)
**Build Command**: `npm run build` (should be auto-detected)
**Output Directory**: `.next` (should be auto-detected)
**Install Command**: `npm install` (should be auto-detected)

### 3. Environment Variables

Add these environment variables in Vercel:

```
NODE_ENV=production
```

**Note**: The backend URL is already configured in `src/lib/config.js` to use the Render URL in production.

### 4. Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. You'll get a URL like: `https://your-app-name.vercel.app`

### 5. Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed

## Configuration Files

### vercel.json
Already created with optimal settings for Next.js deployment.

### next.config.mjs
Updated to work with Vercel deployment:
- Removed API proxy rewrites (not needed for Vercel)
- Added Render backend domain to image domains
- Optimized for production

## Post-Deployment

### 1. Test Your Application
- Visit your Vercel URL
- Test all functionality
- Ensure API calls work with the Render backend

### 2. Monitor Performance
- Use Vercel Analytics (if enabled)
- Monitor build logs for any issues
- Check for any console errors

### 3. Set Up Automatic Deployments
- Vercel automatically deploys on every push to main branch
- You can configure branch deployments in project settings

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **API Connection Issues**
   - Verify the backend URL in `src/lib/config.js`
   - Check CORS settings on your Render backend
   - Ensure the backend is running and accessible

3. **Environment Variables**
   - Double-check all environment variables are set in Vercel
   - Ensure they match what your app expects

### Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Vercel Support: Available in your dashboard

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **CORS**: Ensure your Render backend allows requests from your Vercel domain
3. **HTTPS**: Vercel automatically provides HTTPS
4. **Security Headers**: Already configured in next.config.mjs

## Performance Optimization

1. **Image Optimization**: Next.js automatically optimizes images
2. **Code Splitting**: Next.js automatically splits code
3. **Caching**: Vercel provides edge caching
4. **CDN**: Vercel uses a global CDN for fast loading

Your application should now be successfully deployed on Vercel and connected to your Render backend! 