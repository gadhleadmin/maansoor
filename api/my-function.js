export default function handler(request, response) {
  // Tani waa jawaab celin ka imanaysa backend-kaaga.
  response.status(200).json({ 
    message: 'Jawaab-celin ka timid Vercel Serverless Function!',
    timestamp: new Date().toISOString()
  });
}