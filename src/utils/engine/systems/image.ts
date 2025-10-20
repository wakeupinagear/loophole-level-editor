export interface LoadedImage {
    name: string;
    image: HTMLImageElement;
    width: number;
    height: number;
}

export class ImageSystem {
    #loadingImages: Set<string> = new Set();
    #loadedImages: Record<string, LoadedImage> = {};

    public loadImage(name: string, src: string | HTMLImageElement): void {
        if (this.#loadedImages[name]) {
            return;
        }

        if (typeof src === 'string') {
            if (this.#loadingImages.has(name) || this.#loadedImages[name]) {
                return;
            }

            this.#loadingImages.add(name);

            const image = new Image();
            image.src = src;
            image.onload = () => {
                this.#loadedImages[name] = {
                    name,
                    image,
                    width: image.width,
                    height: image.height,
                };
                console.log(`Loaded image: ${name}`, this.#loadedImages[name]);
                this.#loadingImages.delete(name);
            };
            image.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                this.#loadingImages.delete(name);
            };
        } else {
            this.#loadedImages[name] = {
                name,
                image: src,
                width: src.width,
                height: src.height,
            };
        }
    }

    public getImage(name: string): LoadedImage | null {
        return this.#loadedImages[name] || null;
    }

    public getLoadingImages(): string[] {
        return Array.from(this.#loadingImages);
    }
}
