# 📊 ChurnScope — Customer Churn Prediction

ChurnScope is an interactive web-based **Customer Churn Prediction Platform** that analyzes customer behavior, explores churn patterns, trains multiple classification models, and predicts whether an individual customer is likely to churn.

The project was developed based on the **Customer Churn Prediction** project guideline:

> Predict which customers are likely to stop using a service.

The application focuses on a simulated **telecom customer dataset** and performs the complete machine learning workflow directly in the browser.

---

## 🚀 Features

- 📊 Exploratory Data Analysis (EDA)
- 👥 Synthetic telecom customer dataset with 4,000 records
- 🔍 Churn pattern analysis
- 🧹 Feature preprocessing and encoding
- 🤖 Multiple machine learning models:
  - Logistic Regression
  - Random Forest
  - XGBoost
- 📈 Model performance comparison
- 🎯 Individual customer churn prediction
- 📉 ROC curves and ROC-AUC
- 📋 Confusion matrices
- ⭐ Feature importance analysis
- 📏 Evaluation using:
  - Accuracy
  - Precision
  - Recall
  - F1-score
  - ROC-AUC
- ⚡ Machine learning executed entirely in the browser
- 🎨 Interactive dashboard

---

## 🧠 Machine Learning Workflow

```text
Synthetic Telecom Dataset
          ↓
Data Generation
          ↓
Data Preprocessing
          ↓
Feature Encoding & Standardization
          ↓
Train / Test Split (80/20)
          ↓
 ┌────────┼────────────┐
 ↓        ↓            ↓
Logistic  Random       XGBoost
Regression Forest
 ↓        ↓            ↓
 └────────┼────────────┘
          ↓
 Model Evaluation
          ↓
Accuracy | Precision | Recall
F1-Score | ROC-AUC
          ↓
Interactive Dashboard
          ↓
Customer Churn Prediction
