use crate::*;

pub mod annual_profit;
pub mod index_code;
pub mod index_data;
pub mod profit;
pub mod simulate_result;
pub mod trade;

pub use model::{
    annual_profit::*, index_code::*, index_data::*, profit::*, simulate_result::*, trade::*,
};
