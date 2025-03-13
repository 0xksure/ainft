/**
 * Generates a pixelated image based on a Solana address
 * Inspired by GitHub's identicons and 8bit.js
 */

export function generatePixelatedImage(
    address: string,
    size: number = 200,
    pixelSize: number = 10,
    colorSeed?: string
): string {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Disable image smoothing for pixelated effect
    ctx.imageSmoothingEnabled = false;

    // Generate a color based on the address
    const baseColor = colorSeed || address;
    const hash = simpleHash(baseColor);

    // Create a hue from the hash (0-360)
    const hue = hash % 360;

    // Generate a 5x5 grid of pixels based on the address
    const grid = generateGrid(address);
    const cellSize = size / pixelSize;

    // Fill background
    ctx.fillStyle = `hsl(${hue}, 10%, 20%)`;
    ctx.fillRect(0, 0, size, size);

    // Draw pixels
    for (let y = 0; y < pixelSize; y++) {
        for (let x = 0; x < pixelSize; x++) {
            // Only draw if the grid cell is active
            if (grid[y] && grid[y][x]) {
                // Vary the saturation and lightness slightly based on position
                const saturation = 60 + ((x + y) % 3) * 10;
                const lightness = 50 + ((x * y) % 5) * 5;

                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }

    // Return as data URL
    return canvas.toDataURL('image/png');
}

// Generate a simple hash from a string
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Generate a grid of boolean values based on the address
function generateGrid(address: string): boolean[][] {
    const grid: boolean[][] = [];
    const normalizedAddress = address.replace(/[^a-zA-Z0-9]/g, '');

    // Create a 5x5 grid (or whatever size you want)
    const gridSize = 5;

    // Fill the grid with values derived from the address
    for (let y = 0; y < gridSize; y++) {
        grid[y] = [];
        for (let x = 0; x < gridSize; x++) {
            const index = (y * gridSize + x) % normalizedAddress.length;
            const charCode = normalizedAddress.charCodeAt(index);
            // Make it symmetrical by mirroring the left side
            const xToUse = x < gridSize / 2 ? x : gridSize - x - 1;

            if (x === Math.floor(gridSize / 2)) {
                // Center column uses its own value
                grid[y][x] = charCode % 2 === 0;
            } else {
                // Mirror the left side to the right for symmetry
                grid[y][x] = charCode % 2 === 0;
            }
        }
    }

    return grid;
} 