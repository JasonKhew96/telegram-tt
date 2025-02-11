import React, {
  FC, useMemo, useState, memo, useRef, useCallback, useEffect,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../lib/teact/teactn';

import { GlobalActions } from '../../../global/types';
import { ApiUser } from '../../../api/types';

import { filterUsersByName, getUserFullName } from '../../../modules/helpers';
import { pick, unique } from '../../../util/iteratees';
import useLang from '../../../hooks/useLang';

import ChatOrUserPicker from '../../common/ChatOrUserPicker';

export type OwnProps = {
  isOpen: boolean;
  onClose: NoneToVoidFunction;
};

type StateProps = {
  usersById: Record<string, ApiUser>;
  blockedIds: string[];
  contactIds?: string[];
  localContactIds?: string[];
  currentUserId?: string;
};

type DispatchProps = Pick<GlobalActions, 'loadContactList' | 'setUserSearchQuery' | 'blockContact'>;

const BlockUserModal: FC<OwnProps & StateProps & DispatchProps> = ({
  usersById,
  blockedIds,
  contactIds,
  localContactIds,
  currentUserId,
  isOpen,
  onClose,
  loadContactList,
  setUserSearchQuery,
  blockContact,
}) => {
  const lang = useLang();
  const [filter, setFilter] = useState('');
  // eslint-disable-next-line no-null/no-null
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserSearchQuery({ query: filter });
  }, [filter, setUserSearchQuery]);

  const filteredContactIds = useMemo(() => {
    const availableContactIds = unique([
      ...(contactIds || []),
      ...(localContactIds || []),
    ].filter((contactId) => {
      return contactId !== currentUserId && !blockedIds.includes(contactId);
    }));

    return filterUsersByName(availableContactIds, usersById, filter)
      .sort((firstId, secondId) => {
        const firstName = getUserFullName(usersById[firstId]) || '';
        const secondName = getUserFullName(usersById[secondId]) || '';

        return firstName.localeCompare(secondName);
      });
  }, [blockedIds, contactIds, currentUserId, filter, localContactIds, usersById]);

  const handleRemoveUser = useCallback((userId: string) => {
    const { id: contactId, accessHash } = usersById[userId] || {};
    if (!contactId || !accessHash) {
      return;
    }
    blockContact({ contactId, accessHash });
    onClose();
  }, [blockContact, onClose, usersById]);

  return (
    <ChatOrUserPicker
      isOpen={isOpen}
      chatOrUserIds={filteredContactIds}
      filterRef={filterRef}
      filterPlaceholder={lang('BlockedUsers.BlockUser')}
      filter={filter}
      onFilterChange={setFilter}
      loadMore={loadContactList}
      onSelectChatOrUser={handleRemoveUser}
      onClose={onClose}
    />
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const {
      users: {
        byId: usersById,
      },
      blocked: {
        ids: blockedIds,
      },
      contactList,
      currentUserId,
    } = global;

    return {
      usersById,
      blockedIds,
      contactIds: contactList?.userIds,
      localContactIds: global.userSearch.localUserIds,
      currentUserId,
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'loadContactList', 'setUserSearchQuery', 'blockContact',
  ]),
)(BlockUserModal));
