import asyncio
from playwright.async_api import async_playwright
from io import BytesIO


async def html_to_png_bytes(html_content: str, width: int = 1200, height: int = 800) -> bytes:
    """
    Convert HTML content to PNG bytes using Playwright
    
    Args:
        html_content: String containing HTML to render
        width: Viewport width in pixels
        height: Viewport height in pixels
    
    Returns:
        bytes: PNG image data
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        try:
            # Configure viewport and content
            await page.set_viewport_size({"width": width, "height": height})
            await page.set_content(html_content)
            
            # Wait for potential dynamic content
            await page.wait_for_load_state("networkidle")
            
            # Capture screenshot as bytes
            screenshot_bytes = await page.screenshot(type="png") #optional full_page=true
            
            return screenshot_bytes
            
        finally:
            await browser.close()