insert into
    t_order_copy (
        id,
        name,
        contact,
        address,
        phone,
        buyPrice,
        sellPrice,   
        number,
        remark,
        status,
        createUser,
        updateUser,
        createTime,
        updateTime,
        stockId,
        otherCost,
        orderTime
    )
SELECT
    md5(uuid()) id,
    name,
    contact,
    address,
    phone,
    buyPrice,
    sellPrice,
    number,
    remark,
    status,
    createUser,
    updateUser,
    createTime,
    updateTime,
    stockId,
    otherCost,
    orderTime
from t_order