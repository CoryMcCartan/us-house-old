# PRIOR DATA FOR HOUSE PREDICTIONS

import os
import re
from datetime import date

from urllib.request import urlopen as fetch

import pandas as pd
import numpy as np
import scipy.stats as stats
import statsmodels.formula.api as smf
import statsmodels.api as sm
from statsmodels.regression.linear_model import OLSResults

from fredapi import Fred
import us


def get_national_prior(recalculate=False, filename="nat_prior.pkl", model_dir="models"):
    path = os.path.join(model_dir, filename)

    if os.path.isfile(path) and not recalculate:
        return OLSResults.load(path)

    years = range(1992, 2016, 2)

    gdp_growth = get_gdp_data()
    approvals = get_approvals_data()

    # party of sitting president in each year (1 for Democrat)
    president_series = [-1, 1, 1, 1, 1, -1, -1, -1, -1, 1, 1, 1]
    incumbency_series = [1, 1, -1, -1, -1, -1, -1, -1, 1, 1, -1, -1]
    nat_margin_series = [5.0, -7.1, 0.07, -1.1, -0.5, -4.8, -2.6, 7.9, 10.6, -6.8, 1.2, -5.7]
    midterm_series = []
    gdp_series = []
    approval_series = []

    for year in years:
        gdp_series.append(gdp_growth.loc[f"{year - 1}-01-01"])
        approval = approvals[(date(year, 1, 1) < approvals.date)
                             & (approvals.date < date(year, 6, 1))].approval.mean()
        approval_series.append(approval)
        midterm_series.append(0 if year % 4 == 0 else 1)
        

    ndata = pd.DataFrame({"GDP": gdp_series, "APPR": approval_series,
                        "INC": incumbency_series, "MRG": nat_margin_series,
                        "PRES": president_series, "MID": midterm_series, 
                         "YR": range(-len(years), 0)}, index=years)

    nat_prior = smf.ols("MRG ~ APPR + INC:PRES + PRES:MID", data=ndata).fit()
    nat_prior.save(path)

    return nat_prior

def get_race_prior(recalculate=False, filename="race_prior.pkl", model_dir="models"):
    path = os.path.join(model_dir, filename)

    if os.path.isfile(path) and not recalculate:
        return OLSResults.load(path)

    data = prepare_race_data()

    race_prior = smf.ols("MRG ~ NAT + PVI + INC + PVI:PRES", data=data).fit()

    # Calculate covariance matrix of race prior model
    data["resid"] = race_prior.resid / 100
    by_district = data.pivot(columns="DIST", values="resid")
    by_district.dropna(axis=1, inplace=True)

    district_cov_matrix = np.cov(by_district.values.transpose())

    race_prior.dist_var = np.mean(district_cov_matrix.diagonal())
    race_prior.dist_cov = np.mean(np.extract(1 - np.identity(200), district_cov_matrix))

    race_prior.save(path)

    return race_prior

def prepare_race_data():
    years = range(2002, 2016, 2)

    gdp_growth = get_gdp_data()
    approvals = get_approvals_data()
    cd_vote = get_pvi_data()
    error_by_year = get_error_by_year()

    incumbency_series = []
    margin_series = []
    pvi_series = []
    nat_series = []
    district_series = []
    president_series = []
    midterm_series = []
    years_series = []
    # party of sitting president in each year (1 for Democrat)
    president = {
        2000: 1,
        2002: -1,
        2004: -1,
        2006: -1,
        2008: -1,
        2010: 1,
        2012: 1,
        2014: 1,
    }

    for year in years:
        results = get_results(year)
        
        if year % 4 == 0: # presidential election year
            pvi_string = f"pvi_{year - 2}"
        else:
            pvi_string = f"pvi_{year}"
        
        for race, row in results.groupby("race"):
            dem = row[(row.party == "D") | (row.party == "DFL") | (row.party == "D*")
                     | (row.party == "DEM") | row.party.str.contains("D/") | row.party.str.contains("DEM/")]
            gop = row[(row.party == "R") | (row.party == "R*")| (row.party == "REP")
                     | row.party.str.contains("R/") | row.party.str.contains("REP/")]
            
            # uncontested seat
            if len(dem) == 0:
                incumbent = -1 if gop.iloc[0].incumbent else 0
                margin = np.nan
            elif len(gop) == 0: 
                incumbent = 1 if dem.iloc[0].incumbent else 0
                margin = np.nan
            else:
                margin = dem.general_pct.sum() - gop.general_pct.sum()
                incumbent = 1 if dem.iloc[0].incumbent else -1 if gop.iloc[0].incumbent else 0
            
            
            margin_series.append(margin)
            incumbency_series.append(incumbent)
            pvi_series.append(cd_vote.loc[cd_vote.race == race, pvi_string].item())
            district_series.append(race)
            president_series.append(president[year])
            midterm_series.append(0 if year % 4 == 0 else 1)
            years_series.append(year)
            
            idx = (year - 2016) // 2
            nat_series.append(error_by_year[year])

    data = pd.DataFrame({"INC": incumbency_series, "MRG": margin_series,
                        "PVI": pvi_series, "DIST": district_series,
                        "PRES": president_series, "MID": midterm_series,
                        "NAT": nat_series, "WIN": np.sign(margin_series),
                         "YR": (np.array(years_series) - 2016)/2}, 
                        index=years_series)
    data_clean = data.dropna()

    return data_clean


# Generic Congressional Ballot Polling
def get_bias_prior(recalculate=False, filename="bias_prior.pkl", model_dir="models"):
    path = os.path.join(model_dir, filename)

    if os.path.isfile(path) and not recalculate:
        return OLSResults.load(path)

    generic = pd.read_table("data/generic_polling.tsv")
    bias_by_month = generic.groupby("months").error.mean()

    avg_final_bias = (generic.error / 100).mean()
    final_bias_std = (generic.error / 100).std()

    bias_model = smf.ols("error ~ months", data=generic).fit()
    bias_model.save(path)

    return bias_model

def get_error_by_year():
    generic = pd.read_table("data/generic_polling.tsv")

    # how polling avg in final month compared to end result
    error_by_year = generic[generic.months == 0].groupby("year").error.mean().to_dict()
    # manually add error for years we don't have polling data
    error_by_year[2004] = 2.9
    error_by_year[2002] = 2.6

    return error_by_year


# YEARLY GDP GROWTH
def get_gdp_data():
    FRED = Fred("75d3a2383e8806d7b956a4849aff66a9")
    return FRED.get_series('A191RL1A225NBEA', observation_start='1940-01-01')

# PRESIDENTIAL APPROVAL RATINGS
def get_approvals_data():
    approvals = pd.read_table("data/approval.csv")
    approvals = approvals[["Approving", "President", "Week Ending Date"]]
    approvals.rename(columns={
        "Approving": "approval", 
        "President": "president", 
        "Week Ending Date": "date"}, 
                     inplace=True)

    approvals.date = pd.to_datetime(approvals.date)

    approvals.loc[approvals.date >= pd.to_datetime("1/1/2020"), "date"] -= np.timedelta64(100, "Y")
    approvals.sort_values("date", inplace=True)

    return approvals

# Cook PVI
def get_pvi_data():
    cd_vote = pd.read_table("data/cd_president.tsv")
    # national presidential popular vote margin
    national_margin = {
        2000: 0.5,
        2004: -2.7,
        2008: 7.2,
        2012: 3.9,
        2016: 2.1
    }

    cd_vote["pres_margin_00"] = cd_vote.dem_00 - cd_vote.gop_00
    cd_vote["pres_margin_04"] = cd_vote.dem_04 - cd_vote.gop_04
    cd_vote["pres_margin_08"] = cd_vote.dem_08 - cd_vote.gop_08
    cd_vote["pres_margin_12"] = cd_vote.dem_12 - cd_vote.gop_12
    cd_vote["pres_margin_16"] = cd_vote.dem_16 - cd_vote.gop_16


    cd_vote["pvi_2002"] = cd_vote.pres_margin_00 - national_margin[2000] / 2
    cd_vote["pvi_2006"] = ((cd_vote.pres_margin_04 - national_margin[2004]) 
                           + (cd_vote.pres_margin_00 - national_margin[2000])) / 4
    cd_vote["pvi_2010"] = ((cd_vote.pres_margin_08 - national_margin[2008]) 
                           + (cd_vote.pres_margin_04 - national_margin[2004])) / 4
    cd_vote["pvi_2014"] = ((cd_vote.pres_margin_12 - national_margin[2012]) 
                           + (cd_vote.pres_margin_08 - national_margin[2008])) / 4
    cd_vote["pvi_2018"] = ((cd_vote.pres_margin_16 - national_margin[2016]) 
                           + (cd_vote.pres_margin_12 - national_margin[2012])) / 4

    cd_vote.set_index("race", drop=False, inplace=True)

    return cd_vote


# Get House results for a particular year, 2000-2014
def get_results(year):
    url = f"http://openelections.github.io/fec_results/api/{year}/congress/results.json"
    raw = fetch(url).read().decode("utf-8")

    formatted = re.sub(r'\\\\\\"', "'", raw)
    formatted = re.sub(r'(?<!\\)"', "", formatted)
    formatted = re.sub(r'\\', "", formatted)
    
    data = pd.read_json(formatted, orient="records")
    
    data = data[data.chamber == "H"]
    data.drop(["candidate_suffix", "chamber", "date", "fec_id", "notes", 
               "general_combined_party_pct", "general_combined_party_votes"], 
           axis=1, inplace=True)
    
    data.party = data.party.map(str.strip)
    
    # drop DC and territories
    data = data[~data.state.isin(["DC", "AS", "PR", "VI", "GU", "MP"])]
    
    # drop primary candidates
    data.dropna(subset=["general_pct"], inplace=True)
    
    # use runoff pct. where they exist
    data["pct"] = data.runoff_pct
    data[np.isnan(data.pct)].pct = data[np.isnan(data.pct)].general_pct
    
    data.district = data.district.map(lambda x: x[:2]) # the first 2 characters contain the number
    data.district = pd.to_numeric(data.district, errors="coerce")
    data.dropna(subset=["district"], inplace=True)
    data.district = data.district.map(int)    
    
    data["race"] = data.state + "-" + data.district.map("{:0>2}".format)
    
    return data
