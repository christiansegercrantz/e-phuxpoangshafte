import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Button, Typography } from '@material-ui/core';

import { User, DoneEvent, Event, EventStatus } from '../../types';

import * as AuthSelector from '../../selectors/AuthSelectors';
import * as UserService from '../../services/UserServices';
import * as EventService from '../../services/EventServices';
import { ensure } from '../../utils.ts/HelperFunctions';
import Togglable from '../../components/UI/Togglable';
import {
  ErrorNotification,
  InfoNotification,
  SuccessNotification,
} from '../../components/Notifications';

const EventRequest = ({
  user,
  event,
  token,
}: {
  user: User;
  event: Event;
  token: string;
}) => {
  const acceptPoint = async () => {
    try {
      console.log(
        'FRONTEND: Updating event',
        event.id,
        'for user',
        user.id,
        'to status',
        EventStatus.COMPLETED,
      );
      const updatedEvent = await UserService.updateUserEventStatus(
        user,
        event.id,
        EventStatus.COMPLETED,
      );
      console.log('Successfully accepted event', updatedEvent);
      SuccessNotification(
        `${event.name} för ${user.firstName} ${user.lastName} har godkännts!`,
      );
    } catch (error) {
      console.error({
        error,
        message: 'acceptPoint function could not be completed',
      });
      ErrorNotification(
        `${event.name} för ${user.firstName} ${user.lastName} kunde inte godkännas!`,
      );
    }
  };
  const declinePoint = () => {
    try {
      UserService.updateUserEventStatus(user, event.id, EventStatus.CANCELLED);
      console.log('Successfully declined event');
      InfoNotification(
        `${event.name} för ${user.firstName} ${user.lastName} har förkastas`,
      );
    } catch (error) {
      console.error({
        error,
        message: 'declinePoint function could not be completed',
      });
      ErrorNotification(
        `${event.name} för ${user.firstName} ${user.lastName} kunde inte förkastas!`,
      );
    }
  };

  return (
    <Box>
      {event.name}
      <Button variant={'contained'} onClick={acceptPoint}>
        Godkänn
      </Button>
      <Button variant={'contained'} onClick={declinePoint}>
        Förkasta
      </Button>
    </Box>
  );
};

const UserRequests = ({
  user,
  events,
  token,
}: {
  user: User;
  events: Event[];
  token: string;
}) => {
  const userEvents = user.events.map((dv: DoneEvent) =>
    ensure(events.find((event: Event) => event.id === dv.eventID)),
  );
  const eventsWithRequests = userEvents.map((event: Event) =>
    event ? (
      <EventRequest
        key={`user${user.id}+event${event.id}`}
        user={user}
        event={event}
        token={token}
      />
    ) : (
      <React.Fragment></React.Fragment>
    ),
  );
  return (
    <Box>
      <Typography variant="h4">
        {user.firstName + ' ' + user.lastName}
      </Typography>
      <Box>
        <Togglable
          buttonLabelOpen={'Visa förfrågningar'}
          buttonLabelClose={'Stäng'}
        >
          {eventsWithRequests}
        </Togglable>
      </Box>
    </Box>
  );
};

const RequestPage = () => {
  const token = useSelector(AuthSelector.token);
  const [users, setUsers] = useState<User[] | undefined>();
  const [events, setEvents] = useState<Event[] | undefined>();
  console.table(users);
  useEffect(() => {
    const getEvents = async () => {
      const response = await EventService.getAllEvents();
      setEvents(response);
    };
    const getUsers = async () => {
      const response = await UserService.getAllUsers(token);
      setUsers(response);
    };
    getEvents();
    getUsers();
  }, [token]);

  if (!users || !events) {
    return <React.Fragment></React.Fragment>;
  }

  const usersFilteredEvents = users.map((user: User) => {
    const filteredUser = {
      ...user,
      events: user.events.filter(
        (doneEvent: DoneEvent) => doneEvent.status === EventStatus.PENDING,
      ),
    };
    return filteredUser;
  });
  const usersWithRequests = usersFilteredEvents.filter(
    (user: User) => user.events.length > 0,
  );

  const userRequests = usersWithRequests.map((user: User) => {
    return (
      <UserRequests key={user.id} user={user} events={events} token={token} />
    );
  });

  return (
    <Box>
      <Typography variant="h3">Ansökta underskrifter</Typography>
      {userRequests}
    </Box>
  );
};

export default RequestPage;