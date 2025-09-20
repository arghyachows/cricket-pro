'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Zap, Shield, Crown, User, Users, ArrowRight, ArrowLeft, X, RotateCcw } from 'lucide-react';

function SortablePlayer({ player, isCaptain, isWicketkeeper, isFirstBowler, isSecondBowler, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 border rounded-md bg-card hover:shadow-sm transition-all cursor-grab active:cursor-grabbing text-center relative group ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isCaptain ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''} ${
        isWicketkeeper ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      } ${isFirstBowler ? 'ring-2 ring-green-400 bg-green-50' : ''} ${
        isSecondBowler ? 'ring-2 ring-purple-400 bg-purple-50' : ''
      }`}
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(player.id);
        }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Remove player"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex items-center justify-center space-x-1 mb-2">
        <span className="font-medium text-sm">{player.name}</span>
        <div className="flex items-center space-x-1">
          {isCaptain && <Crown className="w-4 h-4 text-yellow-600" />}
          {isWicketkeeper && <Shield className="w-4 h-4 text-blue-600" />}
          {(isFirstBowler || isSecondBowler) && <Zap className="w-4 h-4 text-green-600" />}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {player.batting_style} • {player.bowler_type}
      </div>
    </div>
  );
}

function DroppableArea({ id, title, players, children, className = "" }) {
  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>{title}</span>
          </span>
          <Badge variant="outline">
            {players.length} players
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3 min-h-[200px]">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DragDropLineup({
  players,
  playingXI,
  captainId,
  wicketkeeperId,
  firstBowlerId,
  secondBowlerId,
  onPlayersChange,
  onRolesChange
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Handle reordering within Playing XI
    if (activeId !== overId) {
      let newPlayingXI = [...playingXI];

      // Find the player being moved
      const player = playingXI.find(p => p.id === activeId);
      if (!player) return;

      // Handle reordering within Playing XI
      if (playingXI.some(p => p.id === overId)) {
        const oldIndex = playingXI.findIndex(p => p.id === activeId);
        const newIndex = playingXI.findIndex(p => p.id === overId);
        newPlayingXI = arrayMove(playingXI, oldIndex, newIndex);
      }

      onPlayersChange(newPlayingXI);
    }

    setActiveId(null);
  };

  const handleRoleChange = (role, playerId) => {
    onRolesChange(role, playerId);
  };

  const handleAddPlayer = (player) => {
    if (playingXI.length < 11) {
      onPlayersChange([...playingXI, player]);
    }
  };

  const handleRemovePlayer = (playerId) => {
    onPlayersChange(playingXI.filter(p => p.id !== playerId));
  };

  const handleResetLineup = () => {
    onPlayersChange([]);
    onRolesChange('captain', '');
    onRolesChange('wicketkeeper', '');
    onRolesChange('firstBowler', '');
    onRolesChange('secondBowler', '');
  };

  const activePlayer = activeId ? playingXI.find(p => p.id === activeId) : null;

  // Get players suitable for different roles
  const getCaptainOptions = () => {
    return playingXI.map(player => ({
      value: player.id,
      label: player.name
    }));
  };

  const getWicketkeeperOptions = () => {
    return playingXI
      .filter(player => player.keeping >= 70) // Only players with good keeping skills
      .map(player => ({
        value: player.id,
        label: player.name
      }));
  };

  const getBowlerOptions = () => {
    return playingXI
      .filter(player => player.bowling >= 40) // Include players with decent bowling skills
      .map(player => ({
        value: player.id,
        label: player.name
      }));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Role Selection Dropdowns */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Team Roles</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetLineup}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Lineup
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-1">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <span>Captain</span>
                </label>
                <Select
                  value={captainId || ""}
                  onValueChange={(value) => handleRoleChange('captain', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Captain" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCaptainOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Wicketkeeper</span>
                </label>
                <Select
                  value={wicketkeeperId || ""}
                  onValueChange={(value) => handleRoleChange('wicketkeeper', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Wicketkeeper" />
                  </SelectTrigger>
                  <SelectContent>
                    {getWicketkeeperOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span>1st Bowler</span>
                </label>
                <Select
                  value={firstBowlerId || ""}
                  onValueChange={(value) => handleRoleChange('firstBowler', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select 1st Bowler" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBowlerOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span>2nd Bowler</span>
                </label>
                <Select
                  value={secondBowlerId || ""}
                  onValueChange={(value) => handleRoleChange('secondBowler', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select 2nd Bowler" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBowlerOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Playing XI Section */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Playing XI</span>
              </span>
              <Badge variant="outline" className="text-xs">
                {playingXI.length}/11
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 min-h-[120px]">
              <SortableContext items={playingXI.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {playingXI.map((player) => (
                  <SortablePlayer
                    key={player.id}
                    player={player}
                    isCaptain={captainId === player.id}
                    isWicketkeeper={wicketkeeperId === player.id}
                    isFirstBowler={firstBowlerId === player.id}
                    isSecondBowler={secondBowlerId === player.id}
                    onRemove={handleRemovePlayer}
                  />
                ))}
              </SortableContext>

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 11 - playingXI.length) }, (_, index) => (
                <div
                  key={`empty-${index}`}
                  className="p-2 border-2 border-dashed border-muted-foreground/30 rounded-md bg-muted/20 flex items-center justify-center min-h-[80px]"
                >
                  <div className="text-center text-muted-foreground text-xs">
                    Empty slot
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Players Pool */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Users className="w-4 h-4" />
              <span>Available Players</span>
              <Badge variant="outline" className="text-xs">
                {players.filter(p => !playingXI.some(px => px.id === p.id)).length} available
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 max-h-96 overflow-y-auto">
              {players
                .filter(p => !playingXI.some(px => px.id === p.id))
                .map((player) => (
                  <div
                    key={player.id}
                    className="p-2 border rounded-md bg-card hover:shadow-sm transition-all cursor-pointer text-center"
                    onClick={() => handleAddPlayer(player)}
                  >
                    <div className="font-medium text-sm mb-1">{player.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {player.batting_style} • {player.bowler_type}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      Click to add
                    </div>
                  </div>
                ))}
            </div>
            {players.filter(p => !playingXI.some(px => px.id === p.id)).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>All players have been assigned to Playing XI</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DragOverlay>
        {activePlayer ? (
          <div className="p-2 border rounded-md bg-card shadow-lg rotate-3 opacity-90 text-center">
            <div className="font-medium text-sm">{activePlayer.name}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
