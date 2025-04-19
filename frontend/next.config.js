/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'archives.bulbagarden.net', // Allow Bulbagarden images
      'raw.githubusercontent.com', // Allow GitHub images
      'i.imgur.com', // Allow Imgur images
      'imgur.com',
      'cdn.discordapp.com', // Allow Discord CDN
      'media.discordapp.net',
      'images.unsplash.com', // Allow Unsplash images
      'picsum.photos', // Allow Lorem Picsum
      'placehold.co', // Allow Placehold.co
      'placekitten.com', // Allow Placekitten
      'via.placeholder.com', // Allow Placeholder.com
      'en.wikipedia.org', // Allow Wikipedia
      'upload.wikimedia.org', // Allow Wikimedia Commons
      'www.wikipedia.org', // Allow Wikipedia
      'example.com', // Allow example.com
      'encrypted-tbn0.gstatic.com', // Allow Google images
      'lh3.googleusercontent.com', // Allow Google user content
      'storage.googleapis.com', // Allow Google Cloud Storage
    ],
  },
};

module.exports = nextConfig;
