# U.S. House Election Prediction
This is a statistical model for the biannual elections of the United States House of Representatives.  We use a Bayesian model based on informative priors and generic congressional ballot polling.  The model is implemented in [Stan](http://mc-stan.org) and coded in Python.

## Files

- `house.ipynb` is a Jupyter notebook that lays out the model and walks through the data collection, processing, and modelling.
- `house.stan` is the Stan model 
- `house.py` loads prior models, prepares data for analysis, runs the simulation, and outputs the results.
- `priors.py` collects data and fits prior models.
- `models/` contains the fitted models in Pickle format. These are stored to save time later and can be renerated at any time.
- `data/` contains data needed to fit prior models and run the analysis—polling, historical results, etc.
- `site/` contains the website that displays the analysis and model results.

## Reproducing the Analysis

1. Clone the repository, or [download it](https://github.com/CoryMcCartan/us-house/archive/master.zip).
1. Install required  packages:
    ```
    pip3 install -r requirements.txt
    npm i -g rollup uglifyjs npm-sass
    npm i
    ```
1. Run `./house.py`
1. To view the analysis website, build it and serve the `output/` folder:
    ```
    cd site/
    npm run build
    cd ../output/
    python3 -m http.server
    ```
