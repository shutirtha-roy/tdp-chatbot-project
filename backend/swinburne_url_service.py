import requests
from bs4 import BeautifulSoup

def parse_sitemap(url):
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"Failed to retrieve {url}")
        return []

    soup = BeautifulSoup(response.content, "xml")
    
    urls = soup.find_all('url')
    sitemaps = soup.find_all('sitemap')
    
    extracted_urls = [url.find('loc').text for url in urls]

    for sitemap in sitemaps:
        loc = sitemap.find('loc').text
        extracted_urls.extend(parse_sitemap(loc))

    return extracted_urls

def save_urls_to_file(urls, filename):
    urls_string = "urls = [\n"
    for url in urls:
        urls_string += f"    '{url}',\n"
    urls_string += "]\n"

    with open(filename, 'w') as file:
        file.write(urls_string)

if __name__ == "__main__":
    sitemap_url = "https://www.swinburne.edu.au/sitemap.xml"
    all_urls = parse_sitemap(sitemap_url)
    sitemap_url2 = 'https://www.swinburneonline.edu.au/sitemap_index.xml'
    all_urls.extend(parse_sitemap(sitemap_url2))


    save_urls_to_file(all_urls, 'urls_list.py')
    
    #for url in all_urls:
        #print(url)



