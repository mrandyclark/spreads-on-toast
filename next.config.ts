import type { NextConfig } from 'next';

const scriptSources =
	process.env.NODE_ENV === 'development'
		? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
		: "script-src 'self' 'unsafe-inline'";

const contentSecurityPolicy = [
	"default-src 'self'",
	"base-uri 'self'",
	"connect-src 'self' https://*.kinde.com https://*.vercel-insights.com",
	"font-src 'self' data:",
	"form-action 'self'",
	"frame-ancestors 'none'",
	"img-src 'self' blob: data:",
	"manifest-src 'self'",
	"object-src 'none'",
	scriptSources,
	"style-src 'self' 'unsafe-inline'",
	"worker-src 'self'",
].join('; ');

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				headers: [
					{ key: 'Access-Control-Allow-Credentials', value: 'true' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
					{
						key: 'Access-Control-Allow-Headers',
						value:
							'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
					},
				],
				source: '/api/external/sign/:path*',
			},
			{
				headers: [
					{ key: 'Content-Security-Policy', value: contentSecurityPolicy },
					{ key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=()' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=63072000; includeSubDomains; preload',
					},
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'DENY' },
				],
				source: '/:path*',
			},
		];
	},
};

export default nextConfig;
