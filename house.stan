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
    real alpha_n_prior[M];
    real<lower=0> sigma_n_prior;
    real<lower=0> reversion_n;
    real mu_prior;
    real<lower=0> mu_mse;
}

transformed data {
    real weight;
    weight = 1 /  reversion_n;
}

parameters {
    real mu[W];    
    real alpha_n[M];
    real alpha_p[P];
    real u[N];
    real<lower=0> sigma_n;
    real<lower=0, upper=0.1> sigma_p;
    real<lower=0, upper=0.1> sigma_e;
    real<lower=0, upper=0.1> sigma_walk;
}

transformed parameters {
    real logit_dem[N];
    
    for (i in 1:N)
        logit_dem[i] = mu[w[i]] + alpha_p[p[i]] + alpha_n[m[i]] + u[i];
}

model {
    n_dem ~ binomial_logit(n_resp, logit_dem);
    
    alpha_n ~ normal(alpha_n_prior, sigma_n);
    log(sigma_n) ~ normal(log(sigma_n_prior), 1);
    alpha_p ~ normal(0, sigma_p);
    u ~ normal(0, sigma_e); 
    
    mu[W] ~ normal(mu_prior, mu_mse);
    for (j in 2:W)
        mu[j-1] ~ normal((mu[j] + weight*mu[W])/(1+weight), sigma_walk);
}