import Office from '../models/Office.js';

export const createOffice = async (req, res) => {
    try {
        const { name, address, city, country, location, workstations } =
            req.body;

        if (!name || !address || !city || !country || !location) {
            return res.status(400).json({
                success: false,
                message:
                    'Please provide all required fields: name, address, city, country, and location',
            });
        }

        const existingOffice = await Office.findOne({ name });
        if (existingOffice) {
            return res.status(400).json({
                success: false,
                message: 'Office with this name already exists',
            });
        }

        const office = await Office.create({
            name,
            address,
            city,
            country,
            location: {
                type: 'Point',
                coordinates: location.coordinates,
            },
            workstations: workstations || [],
        });

        res.status(201).json({
            success: true,
            message: 'Office created successfully',
            data: { office },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating office',
            error: error.message,
        });
    }
};

export const getAllOffices = async (req, res) => {
    try {
        const offices = await Office.find({ active: true }).sort('name');

        res.status(200).json({
            success: true,
            count: offices.length,
            data: { offices },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching offices',
            error: error.message,
        });
    }
};

export const getOffice = async (req, res) => {
    try {
        const office = await Office.findById(req.params.id);

        if (!office) {
            return res.status(404).json({
                success: false,
                message: 'Office not found',
            });
        }

        res.status(200).json({
            success: true,
            data: { office },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching office',
            error: error.message,
        });
    }
};
