import React, {
  FC, useMemo, useState, memo, useRef, useCallback,
} from '../../../lib/teact/teact';
import { getGlobal, withGlobal } from '../../../lib/teact/teactn';

import { GlobalActions } from '../../../global/types';
import { ApiChat } from '../../../api/types';

import { filterUsersByName } from '../../../modules/helpers';
import { pick } from '../../../util/iteratees';
import useLang from '../../../hooks/useLang';

import ChatOrUserPicker from '../../common/ChatOrUserPicker';

export type OwnProps = {
  chat: ApiChat;
  isOpen: boolean;
  onClose: NoneToVoidFunction;
};

type StateProps = {
  currentUserId?: string;
};

type DispatchProps = Pick<GlobalActions, 'loadMoreMembers' | 'deleteChatMember'>;

const RemoveGroupUserModal: FC<OwnProps & StateProps & DispatchProps> = ({
  chat,
  currentUserId,
  isOpen,
  onClose,
  loadMoreMembers,
  deleteChatMember,
}) => {
  const lang = useLang();
  const [filter, setFilter] = useState('');
  // eslint-disable-next-line no-null/no-null
  const filterRef = useRef<HTMLInputElement>(null);

  const usersId = useMemo(() => {
    const availableMemberIds = (chat.fullInfo?.members || [])
      .reduce((acc: string[], member) => {
        if (!member.isAdmin && !member.isOwner && member.userId !== currentUserId) {
          acc.push(member.userId);
        }
        return acc;
      }, []);

    // No need for expensive global updates on users, so we avoid them
    const usersById = getGlobal().users.byId;

    return filterUsersByName(availableMemberIds, usersById, filter);
  }, [chat.fullInfo?.members, currentUserId, filter]);

  const handleRemoveUser = useCallback((userId: string) => {
    deleteChatMember({ chatId: chat.id, userId });
    onClose();
  }, [chat.id, deleteChatMember, onClose]);

  return (
    <ChatOrUserPicker
      isOpen={isOpen}
      chatOrUserIds={usersId}
      filterRef={filterRef}
      filterPlaceholder={lang('ChannelBlockUser')}
      filter={filter}
      onFilterChange={setFilter}
      loadMore={loadMoreMembers}
      onSelectChatOrUser={handleRemoveUser}
      onClose={onClose}
    />
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const { currentUserId } = global;

    return { currentUserId };
  },
  (setGlobal, actions): DispatchProps => pick(actions, ['loadMoreMembers', 'deleteChatMember']),
)(RemoveGroupUserModal));
