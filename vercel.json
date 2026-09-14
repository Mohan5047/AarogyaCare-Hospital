{
  "version": 2,
  "functions": {
    "api/index.js": {
      "includeFiles": "public/**"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/public/$1"
    }
  ]
}
