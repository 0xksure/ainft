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
    ],
  },
};

module.exports = nextConfig;
