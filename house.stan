/*
 * U.S. HOUSE MODEL
 */

data {
    int R; // number of races (435)
    int W; // number of weeks
    int M; // number of months
    int N; // number of polls
    int P; // number of pollsters
    
    int<lower=1> w[N]; // poll week
    int<lower=1> m[N]; // poll month
    int<lower=0> n_resp[N]; // sample size
    int<lower=0> n_dem[N]; // DEM votes
    int<lower=1> p[N]; // pollster
    vector[M] alpha_n_prior; // monthly bias in congressional polling
    matrix[M,M] sigma_n_prior; // error in monthly bias of polling (with month-to-month covariance)
    real mu_prior; // forecasted national popular vote
    real<lower=0> mu_mse; // error in prior forecast
}

transformed data {
    matrix[M,M] cholesky_sigma_n;
    cholesky_sigma_n = cholesky_decompose(sigma_n_prior);
}

parameters {
    // _r suffixes indicate 'raw' parameters to be scaled later
    // used for optimization
    vector[M] alpha_n_r;
    vector[P] alpha_p_r;
    vector[W] delta_mu; // steps of random walk
    vector[N] u;
    real<lower=0, upper=0.15> sigma_p;
    real<lower=0, upper=0.15> sigma_e;
    real<lower=0> sigma_walk;
}

transformed parameters {
    real logit_dem[N];
    vector[W] mu;
    vector[M] alpha_n;
    vector[P] alpha_p;

    alpha_n = alpha_n_prior + cholesky_sigma_n*alpha_n_r;
    alpha_p = sigma_p*alpha_p_r;

    mu[W] = mu_prior + mu_mse*delta_mu[W];
    for (j in 1:(W-1))
        mu[W-j] = mu[W-j+1] + sigma_walk*delta_mu[W-j+1];
    
    for (i in 1:N)
        logit_dem[i] = mu[w[i]] + alpha_p[p[i]] + alpha_n[m[i]] + sigma_e*u[i];
}

model {
    delta_mu ~ normal(0, 1);

    alpha_n_r ~ normal(0, 1);
    alpha_p_r ~ normal(0, 1);
    u ~ normal(0, 1); 

    sigma_walk ~ lognormal(log(0.04), 1);

    n_dem ~ binomial_logit(n_resp, logit_dem);
}
