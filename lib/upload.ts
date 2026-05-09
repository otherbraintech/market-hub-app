
export async function uploadMedia(file: File): Promise<string | null> {
    try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch("http://intelexia-labs-ob-mediafile.af9gwe.easypanel.host/upload", {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`)
        }

        const data = await response.json()
        
        // The response is an array based on the user's example
        if (Array.isArray(data) && data.length > 0 && data[0].success) {
            return data[0].public_url
        }

        return null
    } catch (error) {
        console.error("Error uploading media:", error)
        return null
    }
}
