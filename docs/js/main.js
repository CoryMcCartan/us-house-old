async function main() {
    resp = await fetch("output.json");
    window.output = await resp.json();
    console.log(window.output);
}

main()
