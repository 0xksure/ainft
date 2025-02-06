import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createGenericFile } from "@metaplex-foundation/umi";
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { mockStorage } from '@metaplex-foundation/umi-storage-mock';
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import * as fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

const ENVIRONMENT = process.env.ENVIRONMENT || 'devnet';

async function uploadNFTAssets() {
    // Initialize Umi
    const umi = createUmi("https://api.devnet.solana.com");

    // Use mock storage for local environment, Irys for devnet
    if (ENVIRONMENT === 'local') {
        console.log('Using mock storage provider for local environment');
        umi.use(mockStorage());
    } else {
        console.log('Using Irys storage provider for devnet environment');
        umi.use(irysUploader());
    }

    // Path to images directory
    const imagesDir = join(__dirname, "../../images");

    try {
        // Read all files from the images directory
        const files = await fs.readdir(imagesDir);
        const imageFiles = files.filter(file =>
            file.toLowerCase().endsWith('.jpg') ||
            file.toLowerCase().endsWith('.jpeg') ||
            file.toLowerCase().endsWith('.png')
        );

        console.log(`Found ${imageFiles.length} image files to process`);

        // Create CSV header
        let csvContent = "fileName,imageUri,metadataUri\n";

        // Process each image
        for (const fileName of imageFiles) {
            const filePath = join(imagesDir, fileName);
            console.log(`Processing ${fileName}...`);

            // Read the file
            const fileBuffer = await readFile(filePath);

            // Create a generic file object
            const file = createGenericFile(
                fileBuffer,
                fileName,
                { contentType: `image/${fileName.split('.').pop()}` }
            );

            // Upload the file
            const [imageUri] = await umi.uploader.upload([file]);
            console.log(`Uploaded ${fileName} to ${ENVIRONMENT === 'local' ? 'mock storage' : 'Arweave'}: ${imageUri}`);


            // Create metadata for the NFT
            const metadata = {
                name: `AI NFT #${fileName.split('.')[0]}`,
                symbol: "AINFT",
                description: "AI-generated NFT character",
                image: imageUri,
                attributes: [],
                properties: {
                    files: [{
                        uri: imageUri,
                        type: `image/${fileName.split('.').pop()}`
                    }],
                    category: "image"
                }
            };

            // Upload metadata
            const metadataUri = await umi.uploader.uploadJson(metadata);
            console.log(`Uploaded metadata to ${ENVIRONMENT === 'local' ? 'mock storage' : 'Arweave'}: ${metadataUri}`);

            // Add to CSV content
            csvContent += `${fileName},${imageUri},${metadataUri}\n`;
        }

        // Save URIs to CSV file
        const csvPath = join(imagesDir, `nft-uris-${ENVIRONMENT}.csv`);
        await writeFile(csvPath, csvContent);

        console.log(`Upload complete! Check ${csvPath} for all URIs`);
    } catch (error) {
        console.error('Error uploading assets:', error);
        throw error;
    }
}

uploadNFTAssets().catch(console.error); 