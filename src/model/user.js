module.exports = (sequelize, { social, modelProfile }) => {
    const { DataTypes, Op } = sequelize;
    const type = DataTypes.STRING;

    let socialFields = {};
    if (social) {
        for (let service of social) {
            socialFields[`${service}_id`] = { type };
            socialFields[`${service}_token`] = { type };
        }
    }

    let associations = {};
    if (modelProfile) {
        associations = {
            associations: (user, models) => {
                if (!models[modelProfile]) {
                    throw new Error(`Trying to associate unknow model '${modelProfile}' as the user profile`);
                }
                user.hasOne(models[modelProfile], { foreignKey: "id", sourceKey: "id" });
            }
        };
    }

    return {
        schema: {
            id: { primaryKey: true, type: DataTypes.BIGINT, autoIncrement: true },
            username: { type, allowNull: false, unique: true },
            email: { type, allowNull: false, unique: true },
            email_canonical: { type, allowNull: false, unique: true },
            email_update: { type },
            plain_password: { type: DataTypes.VIRTUAL },
            password: { type, allowNull: false },
            token_confirm: { type, unique: true },
            token_update: { type, unique: true },
            time_pasword_update: { type: DataTypes.DATE },
            time_confirmed: { type: DataTypes.DATE },

            roles: { type: DataTypes.TEXT },
            locale: { type: DataTypes.STRING(10) },
            ...socialFields
        },
        ...associations
    };
};
