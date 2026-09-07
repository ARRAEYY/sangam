const { User, ConnectionRequest } = require('./src/models');

const { Op } = require('sequelize');

async function seedRequests() {
  try {
    const ananya = await User.findOne({ where: { email: 'ananya@nst.rishihood.edu.in' } });
    if (!ananya) {
      console.log('Ananya not found!');
      return;
    }

    const otherUsers = await User.findAll({
      where: {
        id: {
          [Op.ne]: ananya.id
        }
      },
      limit: 2
    });

    for (const user of otherUsers) {
      await ConnectionRequest.findOrCreate({
        where: {
          requester_id: user.id,
          recipient_id: ananya.id,
          status: 'PENDING'
        },
        defaults: {
          requester_id: user.id,
          recipient_id: ananya.id,
          status: 'PENDING'
        }
      });
      console.log(`Created request from ${user.full_name} to Ananya`);
    }

    console.log('Successfully seeded 2 requests to Ananya.');
  } catch (err) {
    console.error('Error seeding requests:', err);
  }
}

seedRequests();
