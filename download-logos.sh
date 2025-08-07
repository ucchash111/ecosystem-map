#!/bin/bash

# Function to clean URL for filename
clean_url() {
    echo "$1" | sed 's|https://||g' | sed 's|http://||g' | sed 's|www\.||g' | sed 's|/.*||g' | tr -d '\r\n'
}

# Function to download favicon/logo
download_logo() {
    local url="$1"
    local clean_name=$(clean_url "$url")
    local logo_dir="/var/www/development/ecosystem-map/public/logos"
    
    if [ -z "$url" ] || [ "$url" == "Website" ]; then
        return
    fi
    
    echo "Processing: $url -> $clean_name"
    
    # Try different logo sources
    local base_url=$(echo "$url" | sed 's|/[^/]*$||')
    
    # Try favicon.ico first
    if curl -s --max-time 10 "$base_url/favicon.ico" -o "$logo_dir/$clean_name.ico" 2>/dev/null; then
        if [ -s "$logo_dir/$clean_name.ico" ]; then
            echo "Downloaded favicon for $clean_name"
            return
        fi
    fi
    
    # Try common logo paths
    for path in "/logo.png" "/logo.svg" "/assets/logo.png" "/images/logo.png"; do
        if curl -s --max-time 10 "$base_url$path" -o "$logo_dir/$clean_name.png" 2>/dev/null; then
            if [ -s "$logo_dir/$clean_name.png" ]; then
                echo "Downloaded logo for $clean_name from $path"
                return
            fi
        fi
    done
    
    # Try Google favicon service as fallback
    local domain=$(echo "$url" | sed 's|https://||g' | sed 's|http://||g' | sed 's|/.*||g')
    if curl -s --max-time 10 "https://www.google.com/s2/favicons?domain=$domain&sz=64" -o "$logo_dir/$clean_name.png" 2>/dev/null; then
        if [ -s "$logo_dir/$clean_name.png" ]; then
            echo "Downloaded Google favicon for $clean_name"
            return
        fi
    fi
    
    echo "Could not download logo for $clean_name"
    rm -f "$logo_dir/$clean_name.ico" "$logo_dir/$clean_name.png" 2>/dev/null
}

# Get all URLs and download logos
curl -s "https://sheets.googleapis.com/v4/spreadsheets/1lJNQQtRTlRUEpki9D0mZJhplM9BEvbNSF5LVXREir3c/values/All!B:B?key=AIzaSyDd8d_CSaltt-8Nbt1TTUUdKXE6IlYG41E" | \
jq -r '.values[][]' | \
while read -r url; do
    download_logo "$url"
    sleep 1  # Be nice to servers
done